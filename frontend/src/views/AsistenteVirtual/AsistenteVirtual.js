import React, { useState, useRef, useEffect } from 'react';

// --- Estilos (Añadidos estilos para Typing Indicator y pre-wrap) ---
const styles = {
  // ... (Estilos anteriores: chatContainer, header, etc. se mantienen igual) ...
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '70vh', // Altura ajustable
    width: '400px', // Ancho ajustable
    border: '1px solid #ccc',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    backgroundColor: '#f9f9f9', // Fondo ligeramente gris claro
    margin: '20px auto'
  },
  header: {
    backgroundColor: '#004d4d', // Teal oscuro
    color: 'white',
    padding: '10px 15px',
    fontWeight: 'bold',
    fontSize: '1.1em',
    flexShrink: 0
  },
  messageList: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '15px',
    backgroundColor: 'white', // Fondo blanco para mensajes
    display: 'flex',
    flexDirection: 'column',
    gap: '10px' // Espacio entre burbujas
  },
  // Estilos Comunes para Burbujas
  messageBubbleBase: {
      display: 'flex',
      // marginBottom: '15px', // Usamos gap en el contenedor ahora
      maxWidth: '85%'
  },
  // Estilos BOT
  messageBubbleBot: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
  },
  botIconContainer: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '10px',
    flexShrink: 0
  },
  botIconSvg: { width: '24px', height: '24px', fill: '#555' },
  messageContentBot: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  messageTextBot: {
    backgroundColor: '#f1f1f1',
    padding: '10px 15px',
    borderRadius: '15px',
    borderTopLeftRadius: '5px',
    fontSize: '0.95em',
    lineHeight: '1.4',
    textAlign: 'left',
    color: '#333',
    whiteSpace: 'pre-wrap', // <-- IMPORTANTE para saltos de línea
    wordWrap: 'break-word' // Para palabras largas
  },
  // Estilos USUARIO
  messageBubbleUser: {
    alignItems: 'flex-start',
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse'
  },
  userIconContainer: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '10px',
    flexShrink: 0
  },
  userIconSvg: { width: '24px', height: '24px', fill: 'white' },
   messageContentUser: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  messageTextUser: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px 15px',
    borderRadius: '15px',
    borderTopRightRadius: '5px',
    fontSize: '0.95em',
    lineHeight: '1.4',
    textAlign: 'left',
    whiteSpace: 'pre-wrap', // <-- IMPORTANTE para saltos de línea
    wordWrap: 'break-word'
  },
  timestamp: { fontSize: '0.75em', color: '#888', marginTop: '5px' },
  referenceSection: {
      marginTop: '10px',
      fontSize: '0.85em',
      color: '#555',
      paddingTop: '8px',
      borderTop: '1px solid #eee' // Separador ligero
  },
  referenceLink: {
      display: 'flex',
      alignItems: 'center',
      marginTop: '5px',
      padding: '5px 8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#fafafa',
      textDecoration: 'none',
      color: '#007bff'
  },
  referenceIndex: { fontSize: '0.75em', fontWeight: 'bold', marginRight: '8px', color: '#333' },

  // --- Estilo para Indicador de "Escribiendo" ---
  typingIndicator: {
      display: 'flex',
      alignItems: 'center',
      alignSelf: 'flex-start', // Alinear a la izquierda como el bot
      padding: '5px 0px', // Espacio vertical
      marginBottom: '10px' // Margen inferior
  },
  typingDot: {
      height: '8px',
      width: '8px',
      backgroundColor: '#aaa',
      borderRadius: '50%',
      display: 'inline-block',
      margin: '0 2px',
      animation: 'typingBounce 1.3s infinite ease-in-out' // Nombre de la animación
  },
  // Input Area (sin cambios mayores)
  inputArea: { display: 'flex', alignItems: 'center', padding: '10px 15px', borderTop: '1px solid #e0e0e0', backgroundColor: 'white', flexShrink: 0 },
  inputField: { flexGrow: 1, border: 'none', outline: 'none', padding: '8px 5px', fontSize: '1em', marginRight: '10px' },
  sendButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  sendIconSvg: { width: '22px', height: '22px', fill: '#007bff' }
};

// --- Keyframes para la animación (deben estar fuera del objeto styles, idealmente en CSS global o <style>) ---
const typingAnimation = `
  @keyframes typingBounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1.0); }
  }
`;


// --- Componente AsistenteVirtual ---
function AsistenteVirtual() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hola, soy Rivet, tu veterinaria favorita, en que puedo ayudarte?', timestamp: 'hace 9 minutos', reference: null }
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false); // <-- Nuevo estado para "escribiendo"
  const messageListRef = useRef(null);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, isBotTyping]); // También hacer scroll si aparece/desaparece el indicador

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSendMessage = () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isBotTyping) return; // Evitar doble envío o envío mientras escribe

    const userMessage = {
      id: Date.now(), sender: 'user', text: trimmedInput, timestamp: 'Ahora mismo', reference: null
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsBotTyping(true); // <-- Activar indicador

    // Simular respuesta del bot
    setTimeout(() => {
      let botResponseText = "Lo siento, no he sido programado para responder a eso aún. Intenta preguntar sobre el horario o cómo registrar una cita.";
      let botReference = null;
      const lowerCaseInput = trimmedInput.toLowerCase();

      // Lógica de respuesta mejorada
      if (lowerCaseInput.includes('horario')) {
        botResponseText = "El horario de atención no se menciona específicamente en los documentos disponibles. Sin embargo, puedes contactar al Hospital Nacional Dos de Mayo para obtener esta información.\n\nPuedes comunicarte con:\n- Responsable del Portal de Transparencia: Ing. Carlos Humberto Viera Gutiérrez (Tel: 3280028, anexo 3332)\n- Responsable de acceso a la información: Ing. Adm. Eduardo Luis Cerro Olivares (Tel: 3280028, anexo 3211) [1].";
        botReference = { index: 1, text: 'Portal del Estado Peruano - Portal de Transp...', url: '#' };
      } else if (lowerCaseInput.includes('registrar') && lowerCaseInput.includes('cita')) {
        // Usamos template literals (`) para manejar fácilmente múltiples líneas
        botResponseText = `Para registrar una cita en el Hospital Nacional Dos de Mayo, debes seguir estos pasos:

1. Accede a la página de consulta de citas del Hospital Nacional Dos de Mayo.
2. Ingresa tu número de DNI en el campo correspondiente.
3. Introduce tu fecha de nacimiento en el formato "dd-mm-yyyy".
4. Haz clic en el botón "Consultar".
5. Si tienes citas pendientes, puedes marcar la casilla "Mostrar Pendiente" para verlas.

Estos pasos te permitirán consultar y registrar tus citas en el sistema del hospital [1].`;
        botReference = { index: 1, text: 'Consultar Cita - Citas.pdf', url: '#' }; // Referencia al PDF
      } else if (lowerCaseInput.includes('gracias')) {
        botResponseText = "¡De nada! Si necesitas algo más, no dudes en preguntar.";
      } else if (lowerCaseInput.includes('hola') || lowerCaseInput.includes('buenos')) {
        botResponseText = "¡Hola! ¿En qué puedo ayudarte hoy?";
      }
      // ... (añadir más condiciones else if aquí) ...

      const botMessage = {
        id: Date.now() + 1, sender: 'bot', text: botResponseText, timestamp: 'Ahora mismo', reference: botReference
      };

       setMessages(prevMessages => [...prevMessages, botMessage]);
       setIsBotTyping(false); // <-- Desactivar indicador

    }, 1200 + Math.random() * 800); // Delay un poco más variable (1.2s - 2s)
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Estilos de animación inyectados (o ponerlos en un <style> en index.html o archivo CSS global) */}
      <style>{typingAnimation}</style>
      <div style={styles.chatContainer}>
        {/* Header */}
        <div style={styles.header}>MediAssist</div>

        {/* Lista de Mensajes */}
        <div style={styles.messageList} ref={messageListRef}>
          {messages.map((msg) => (
            <div key={msg.id} style={{...styles.messageBubbleBase, ...(msg.sender === 'bot' ? styles.messageBubbleBot : styles.messageBubbleUser)}}>
              {/* Icono */}
              <div style={msg.sender === 'bot' ? styles.botIconContainer : styles.userIconContainer}>
                {msg.sender === 'bot' ? (
                  <svg style={styles.botIconSvg} viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h14v-8h3L12 3zm4.5 16h-9v-5.5H3L12 5.66 21 13.5h-4.5V19z"/><path d="M10 10h4v9h-4z"/></svg>
                ) : (
                  <svg style={styles.userIconSvg} viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                )}
              </div>
              {/* Contenido */}
              <div style={msg.sender === 'bot' ? styles.messageContentBot : styles.messageContentUser}>
                  <div style={msg.sender === 'bot' ? styles.messageTextBot : styles.messageTextUser}>
                      {msg.text}
                      {msg.reference && (
                          <div style={styles.referenceSection}>
                              1 referencia <span style={{cursor:'pointer'}}>▾</span>
                              <a href={msg.reference.url} target="_blank" rel="noopener noreferrer" style={styles.referenceLink}>
                                <span style={styles.referenceIndex}>{msg.reference.index}</span> {msg.reference.text}
                              </a>
                          </div>
                      )}
                  </div>
                  <div style={styles.timestamp}>{msg.timestamp}</div>
              </div>
            </div>
          ))}
          {/* --- Indicador de Escribiendo --- */}
          {isBotTyping && (
            <div style={styles.typingIndicator}>
              <div style={styles.botIconContainer}> {/* Reutilizar icono del bot */}
                  <svg style={styles.botIconSvg} viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h14v-8h3L12 3zm4.5 16h-9v-5.5H3L12 5.66 21 13.5h-4.5V19z"/><path d="M10 10h4v9h-4z"/></svg>
              </div>
              {/* Puntos animados */}
              <div style={{...styles.messageTextBot, padding: '10px 15px'}}> {/* Reutilizar estilo burbuja */}
                  <span style={{...styles.typingDot, animationDelay: '0s'}}></span>
                  <span style={{...styles.typingDot, animationDelay: '0.2s'}}></span>
                  <span style={{...styles.typingDot, animationDelay: '0.4s'}}></span>
              </div>
            </div>
          )}
        </div>

        {/* Área de Input */}
        <div style={styles.inputArea}>
          <input
            type="text" style={styles.inputField} placeholder="Escriba su mensaje"
            value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown} disabled={isBotTyping} // Deshabilitar input mientras escribe
          />
          <button style={styles.sendButton} onClick={handleSendMessage} disabled={isBotTyping}> {/* Deshabilitar botón */}
            <svg style={styles.sendIconSvg} viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}

export default AsistenteVirtual;