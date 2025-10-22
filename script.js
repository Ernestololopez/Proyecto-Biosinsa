// script.js
$(document).ready(function() {
  const $form = $('#userForm');
  const $tablaBody = $('#tablaRegistros tbody');

  function calcularEdad(fechaStr) {
    if (!fechaStr) return null;
    const hoy = new Date();
    const fn = new Date(fechaStr);
    let edad = hoy.getFullYear() - fn.getFullYear();
    const m = hoy.getMonth() - fn.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) {
      edad--;
    }
    return edad;
  }

  function mostrarAlert(tipo, mensaje) {
    // bootstrap alert temporal
    const id = 'alert-temp';
    $('#' + id).remove();
    const alertHtml = `
      <div id="${id}" class="alert alert-${tipo} position-fixed top-0 end-0 m-3 shadow" role="alert" style="z-index:9999;">
        ${mensaje}
      </div>
    `;
    $('body').append(alertHtml);
    setTimeout(() => $('#' + id).fadeOut(300, function(){ $(this).remove(); }), 3000);
  }

  function limpiarFormulario() {
    $form[0].reset();
    $form.find('.is-invalid').removeClass('is-invalid');
    $('#edad').val('');
  }

  function cargarRegistros() {
    $.ajax({
      url: 'fetch.php',
      method: 'GET',
      dataType: 'json'
    }).done(function(res) {
      if (res.success) {
        $tablaBody.empty();
        res.data.forEach(row => {
          const tr = <tr><td>${escapeHtml(row.nombre)}</td><td>${escapeHtml(row.correo)}</td></tr>;
          $tablaBody.append(tr);
        });
      } else {
        mostrarAlert('warning', 'No se pudieron cargar los registros.');
      }
    }).fail(function() {
      mostrarAlert('danger', 'Error al conectar con el servidor.');
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"'`=\/]/g, function(s) {
      return ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
      })[s];
    });
  }

  // submit
  $form.on('submit', function(e) {
    e.preventDefault();

    // Validaciones front
    const nombre = $('#nombre').val().trim();
    const fecha_nacimiento = $('#fecha_nacimiento').val();
    const sexo = $('#sexo').val();
    const correo = $('#correo').val().trim();
    const edadCalc = calcularEdad(fecha_nacimiento);

    let valid = true;
    $form.find('.is-invalid').removeClass('is-invalid');

    if (!nombre) {
      $('#nombre').addClass('is-invalid'); valid = false;
    }
    if (!fecha_nacimiento || isNaN(new Date(fecha_nacimiento))) {
      $('#fecha_nacimiento').addClass('is-invalid'); valid = false;
    }
    if (!sexo) {
      $('#sexo').addClass('is-invalid'); valid = false;
    }
    if (!correo || !/^\S+@\S+\.\S+$/.test(correo)) {
      $('#correo').addClass('is-invalid'); valid = false;
    }
    if (edadCalc === null || isNaN(edadCalc)) {
      mostrarAlert('danger', 'No se pudo calcular la edad desde la fecha.');
      valid = false;
    } else if (edadCalc < 18 || edadCalc > 60) {
      mostrarAlert('warning', 'La persona debe tener entre 18 y 60 años.');
      valid = false;
    }

    if (!valid) return;

    $('#edad').val(edadCalc);

    // preparar payload JSON
    const payload = {
      nombre: nombre,
      edad: edadCalc,
      sexo: sexo,
      fecha_nacimiento: fecha_nacimiento,
      correo: correo
    };

    // enviar por AJAX (JSON)
    $.ajax({
      url: 'insert.php',
      method: 'POST',
      data: JSON.stringify(payload),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json'
    }).done(function(res) {
      if (res.success) {
        mostrarAlert('success', res.message || 'Guardado con éxito.');
        limpiarFormulario();
        cargarRegistros();
      } else {
        mostrarAlert('danger', res.message || 'Ocurrió un error.');
      }
    }).fail(function(jqXHR) {
      let msg = 'Error al conectar con el servidor.';
      if (jqXHR.responseJSON && jqXHR.responseJSON.message) msg = jqXHR.responseJSON.message;
      mostrarAlert('danger', msg);
    });
  });

  // cargar registros al inicio
  cargarRegistros();
});
