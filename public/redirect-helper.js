// Script para ayudar con las redirecciones en la aplicación
document.addEventListener('DOMContentLoaded', function() {
  // Buscar el botón "Ir al Dashboard" cuando exista en el DOM
  const checkForDashboardButton = setInterval(function() {
    const dashboardButton = document.querySelector('button:contains("Ir al Dashboard")') || 
                            document.querySelector('button:contains("ir al dashboard")') ||
                            document.querySelector('button:contains("Ir al")');
    
    if (dashboardButton) {
      clearInterval(checkForDashboardButton);
      console.log('Botón de Dashboard encontrado, añadiendo comportamiento alternativo');
      
      // Reemplazar el evento click
      dashboardButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Mostrar mensaje visual al usuario
        const messageDiv = document.createElement('div');
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translateX(-50%)';
        messageDiv.style.padding = '15px 20px';
        messageDiv.style.backgroundColor = '#4CAF50';
        messageDiv.style.color = 'white';
        messageDiv.style.borderRadius = '4px';
        messageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        messageDiv.style.zIndex = '9999';
        messageDiv.textContent = 'Configuración finalizada. Redirigiendo al login...';
        document.body.appendChild(messageDiv);
        
        // Guardar en localStorage que la configuración está completa
        localStorage.setItem('setup_completed', 'true');
        console.log('Configuración marcada como completa en localStorage');
        
        // Redireccionar al login después de un breve retraso
        setTimeout(function() {
          window.location.href = '/sign-in?redirect_url=/dashboard';
        }, 1500);
        
        return false;
      }, true);
    }
  }, 500); // Comprobar cada 500ms
});

// Función auxiliar para buscar texto en botones (similar a jQuery :contains)
(function() {
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }
  
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
      var el = this;
      do {
        if (el.matches(s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }
  
  document.querySelectorAll = document.querySelectorAll || function(selector) {
    return document.querySelectorAll(selector);
  };
  
  // Añadir selector personalizado :contains
  Document.prototype.querySelector = Document.prototype.querySelector || function(selector) {
    if (selector.indexOf(':contains(') !== -1) {
      const parts = selector.match(/(.*):contains\(["']?([^"']*)["']?\)(.*)/i);
      if (parts) {
        const [_, before, text, after] = parts;
        const elements = document.querySelectorAll(before + after || '*');
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].textContent.indexOf(text) !== -1) {
            return elements[i];
          }
        }
        return null;
      }
    }
    return document.querySelector(selector);
  };
})();
