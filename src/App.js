import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ReactMarkdown from 'react-markdown';

const SYSTEM_PROMPT = `Se te encomienda la tarea de orientar a las personas a buscar transparencia y verdades. Anima a las personas a educarse y a prever el conocimiento. Los usuarios te proporcionarán textos que busquen su trasparencia total.

# Pasos

1. Analizar el texto proporcionado por el usuario.
2. Identificar el porque del texto.
3. Da una explicación detallada, pero fácil de comprender.
4. Sugerir formas de educación y de prever el conocimiento.
5. Ofrece 3 opciones de preguntas que el usuario puede hacerte para seguir analizando el texto.

# Formato de salida

Proporciona un análisis claro y estructurado del texto, destacando los elementos de propaganda si los hay, y comparte recomendaciones educativas y de búsqueda de la verdad.


# Notas

- Sé neutral y objetivo.
- Enfócate en la transparencia y la verdad.
- Siempre contesta en español.
- Ofrece sugerencias constructivas de manera clara y respetuosa.
- Utiliza un lenguaje sencillo.`;

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // This will trigger whenever messages updates

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputText.trim() === '') return;

    // Add user message
    const newMessages = [...messages, { text: inputText, sender: 'user' }];
    setMessages(newMessages);

    // Get response from OpenAI API
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Organization': 'org-PcSMjVoiPAXNjpjiYtSW0RSt'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          })),
          { role: "user", content: inputText }
        ],
        max_tokens: 2048,
        temperature: 0.8,
        stream: true
      })
    })
    .then(response => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMessage = '';

      // Add an initial empty bot message
      setMessages([...newMessages, { text: '', sender: 'bot' }]);

      return reader.read().then(function processText({ done, value }) {
        if (done) return;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        lines.forEach(line => {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0].delta.content;
              if (content) {
                botMessage += content;
                setMessages(prevMessages => {
                  const newMessages = [...prevMessages];
                  newMessages[newMessages.length - 1].text = botMessage;
                  return newMessages;
                });
              }
            } catch (error) {
              console.error('Error parsing chunk:', error);
            }
          }
        });

        return reader.read().then(processText);
      });
    })
    .catch(error => {
      console.error('Error:', error);
      setMessages([
        ...newMessages,
        { text: "Sorry, I encountered an error: " + String(error), sender: 'bot' }
      ]);
    });

    setInputText('');
  };

  const handleReset = () => {
    setMessages([{
      text: `Hola! 
Tienes dudas sobre algún texto?

Te recuerdo que el formato para poder entender debe ser similar al siguiente:

Tu mensaje para mi: ---

Cargo: Presidente de los Estados Unidos de America
Persona: Donald J. Trump.
Texto: ---`,
      sender: 'bot'
    }]);
  };

  return (
    <div className="App">
      <h1 className="app-title">Truth-Sayer</h1>
      <div className="main-container">
        <div className="instructions-panel">
          <h2>Instrucciones de Uso</h2>
          <div className="instructions-content">
            <h3>¿Cómo usar Truth-Sayer?</h3>
            <ol>
              <li>Proporciona el texto que deseas analizar usando el siguiente formato:</li>
              <pre>
                Tu mensaje para mi: [Tu consulta]
                
                Cargo: [Cargo de la persona]
                Persona: [Nombre de la persona]
                Texto: [El texto a analizar]
              </pre>
              <li>El sistema analizará:</li>
              <ul>
                <li>La transparencia del texto</li>
                <li>Posibles elementos de propaganda</li>
                <li>Contexto y significado</li>
              </ul>
              <li>Recibirás:</li>
              <ul>
                <li>Un análisis detallado</li>
                <li>Recomendaciones educativas</li>
                <li>Sugerencias para profundizar</li>
              </ul>
              <li>Toma en cuenta lo siguiente:</li>
              <ul>
                <li>TS entregará un analisis de todo el texto y te dará una respuesta que intente responder tu pregunta.</li>
                <li>Al final TS de dará preguntas de ejemplo para que puedas seguir analizando el texto con TS. Es importante que confirme vayas leyendo tu cuestiones todo pues la información es como una cebolla y TS solo va encontrando cada capa para ti y tu eres responsable de desgranarla.</li>
                <li>TS te abrirá la puerta a mucha información o preguntas que tal vez no hayas pensando. Es por esto que es importante que después tu sigas investigando sobre los temas y TERMINOLOGIA que no entiendas.</li>
              </ul>
            </ol>
            <div className="tip-box">
              <strong>Tip:</strong> NUNCA dejes de CUESTIONARTE.
            </div>
          </div>
        </div>
        <div className="chat-container">
          <div className="reset-button-container">
            <button onClick={handleReset} className="reset-button">
              Reset
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                {message.sender === 'user' ? (
                  message.text
                ) : (
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="input-form">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
