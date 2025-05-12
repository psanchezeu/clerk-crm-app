// Script para ayudar con la redirección después de la configuración
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si venimos de completar la configuración
  function checkSetupComplete() {
    try {
      const url = new URL(window.location.href);
      const setupBypass = url.searchParams.get('setup_bypass');
      const setupCompleted = localStorage.getItem('setup_completed');
      
      console.log('[SigninHelper] Verificando redirección. setup_bypass:', setupBypass);
      console.log('[SigninHelper] setup_completed en localStorage:', setupCompleted);
      
      // Si tenemos el parámetro de bypass o tenemos localStorage indicando que setup está completado
      if (setupBypass || setupCompleted === 'true') {
        console.log('[SigninHelper] Configuración completada detectada');
        
        // Asegurarse que localStorage esté actualizado
        localStorage.setItem('setup_completed', 'true');
        
        // No dejar que el usuario vuelva al setup
        history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', function() {
          history.pushState(null, '', window.location.href);
        });
        
        console.log('[SigninHelper] Protección contra navegación atrás activada');
      }
    } catch (error) {
      console.error('[SigninHelper] Error:', error);
    }
  }
  
  // Ejecutar la verificación
  checkSetupComplete();
});
