/**
 * Script de emergencia para el bypass de autenticación
 * Establece cookies y localStorage para permitir acceso en todas las páginas
 */

(function() {
  // Constantes
  const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 horas
  const EMERGENCY_COOKIE = 'emergency_access';
  const SETUP_COOKIE = 'setup_completed';

  // Comprobar si estamos en modo de emergencia por URL
  function checkEmergencyModeFromUrl() {
    const url = new URL(window.location.href);
    return url.searchParams.has('emergency_token') || url.searchParams.has('emergency');
  }

  // Comprobar si ya tenemos acceso de emergencia
  function hasEmergencyAccess() {
    return (
      localStorage.getItem(EMERGENCY_COOKIE) === 'true' ||
      document.cookie.includes(`${EMERGENCY_COOKIE}=true`)
    );
  }

  // Establecer todos los mecanismos de acceso de emergencia
  function setAllEmergencyAccess() {
    console.log('[EmergencyBypass] Estableciendo acceso de emergencia...');
    
    // Establecer en localStorage
    localStorage.setItem(EMERGENCY_COOKIE, 'true');
    localStorage.setItem(SETUP_COOKIE, 'true');
    
    // Establecer cookies
    document.cookie = `${EMERGENCY_COOKIE}=true;path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`;
    document.cookie = `${SETUP_COOKIE}=true;path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`;
    
    console.log('[EmergencyBypass] Acceso de emergencia establecido');
  }
  
  // Reforzar cookies cada 5 segundos para asegurar que no expiren
  function startCookieRefresher() {
    setInterval(() => {
      if (hasEmergencyAccess()) {
        document.cookie = `${EMERGENCY_COOKIE}=true;path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`;
        document.cookie = `${SETUP_COOKIE}=true;path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`;
      }
    }, 5000);
  }
  
  // Función principal
  function init() {
    console.log('[EmergencyBypass] Inicializando bypass de emergencia...');
    
    // Si tenemos acceso de emergencia o estamos en modo de emergencia por URL
    if (hasEmergencyAccess() || checkEmergencyModeFromUrl()) {
      setAllEmergencyAccess();
      startCookieRefresher();
    }
    
    // Para páginas específicas que siempre deben tener acceso
    if (window.location.pathname === '/setup' || 
        window.location.pathname === '/emergency-login') {
      setAllEmergencyAccess();
      startCookieRefresher();
    }
  }
  
  // Ejecutar cuando el DOM esté cargado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
