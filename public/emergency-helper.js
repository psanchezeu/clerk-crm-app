/**
 * Script auxiliar para el modo de emergencia
 * Proporciona funciones para verificar y establecer el acceso de emergencia
 */

// Verificar si existe un token de emergencia en localStorage
function checkEmergencyAccess() {
  return localStorage.getItem('emergency_access') === 'true';
}

// Intentar recuperar el acceso de emergencia si existe
function tryRecoverEmergencyAccess() {
  if (checkEmergencyAccess()) {
    console.log('Acceso de emergencia encontrado en localStorage');
    
    // Intentar establecer la cookie desde JavaScript como respaldo
    document.cookie = `emergency_access=true;path=/;max-age=${60 * 60 * 24};samesite=lax`;
    document.cookie = `setup_completed=true;path=/;max-age=${60 * 60 * 24};samesite=lax`;
    
    // Si estamos en la página de login de emergencia, redirigir a setup
    if (window.location.pathname === '/emergency-login') {
      console.log('Redirigiendo a setup desde emergency-login');
      window.location.href = '/setup?from=emergency';
    }
  }
}

// Verificar el acceso cuando se carga la página
window.addEventListener('DOMContentLoaded', () => {
  tryRecoverEmergencyAccess();
});

// También exponer la función en window para llamarla desde las páginas
window.checkEmergencyAccess = checkEmergencyAccess;
window.tryRecoverEmergencyAccess = tryRecoverEmergencyAccess;
