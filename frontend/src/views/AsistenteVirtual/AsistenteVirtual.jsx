import React from 'react';

// Ya no necesitamos useState, useRef, useEffect, ni los estilos anteriores.

// --- Componente AsistenteVirtual Modificado ---
function AsistenteVirtual() {
  // Define la URL de tu bot de Copilot Studio
  const botUrl = "https://copilotstudio.microsoft.com/environments/Default-b4a40545-7779-4b38-aff7-1f1738f80840/bots/cra5a_agente6eOvgi/webchat?__version__=2";

  // Estilos para el contenedor del iframe (puedes ajustar esto)
  // Es importante darle una altura definida al contenedor para que el iframe (con height: 100%) funcione bien.
  const iframeContainerStyle = {
    width: '100%',          // Ocupa el ancho disponible en el layout de CoreUI
    height: '80vh',         // Altura: 80% de la altura visible del navegador (ajusta según necesites)
    border: 'none',         // Sin borde en el contenedor
    overflow: 'hidden',     // Para asegurar que el iframe no cause barras de scroll inesperadas en el contenedor
    // Puedes añadir más estilos como padding o margin si lo deseas
    // padding: '1rem'
  };

  // Estilos para el iframe mismo
  const iframeStyle = {
    width: '100%',
    height: '100%', // El iframe ocupará el 100% del contenedor div
    border: 'none'  // Quita el borde por defecto del iframe
  };

  // El componente ahora retorna el div contenedor con el iframe dentro
  return (
    <div style={iframeContainerStyle}>
      <iframe
        src={botUrl}
        style={iframeStyle}
        title="Asistente Virtual MediAssist" // Añade un título descriptivo para accesibilidad
        // frameborder="0" // 'frameborder' está obsoleto en HTML5, usa CSS (border: 'none')
      >
        {/* Mensaje para navegadores que no soportan iframes */}
        Tu navegador no soporta iframes. Por favor, actualízalo para usar el asistente virtual.
      </iframe>
    </div>
  );
}

export default AsistenteVirtual;