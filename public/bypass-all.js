/**
 * SOLUCIÓN RADICAL PARA ACCESO DE EMERGENCIA
 * 
 * Este script proporciona un mecanismo completo para saltarse todas
 * las comprobaciones de autenticación cuando Clerk no está disponible.
 * 
 * Funciona insertando un token en sessionStorage que será verificado por el middleware.
 */

(function() {
  const EMERGENCY_TOKEN = 'emergency_auth_active';
  
  // Marcamos el acceso de emergencia en sessionStorage (persiste durante la sesión del navegador)
  function enableEmergencyAccess() {
    try {
      // Guardar en todas las posibles ubicaciones
      sessionStorage.setItem(EMERGENCY_TOKEN, 'true');
      localStorage.setItem(EMERGENCY_TOKEN, 'true');
      
      // También en cookies para el servidor
      document.cookie = `${EMERGENCY_TOKEN}=true;path=/;max-age=${60*60*24};samesite=lax`;
      
      // También guardar los tokens de configuración
      document.cookie = `setup_completed=true;path=/;max-age=${60*60*24};samesite=lax`;
      localStorage.setItem('setup_completed', 'true');
      
      console.log('[BYPASS] Acceso de emergencia ACTIVADO');
      
      // Forzar la redirección a setup después de activar
      if (window.location.pathname === '/emergency-login') {
        console.log('[BYPASS] Redirigiendo a setup desde login de emergencia...');
        setTimeout(() => {
          window.location.href = '/setup?token=emergency';
        }, 500);
      }
    } catch (e) {
      console.error('[BYPASS] Error al configurar acceso de emergencia', e);
    }
  }
  
  // Comprobar si venimos con password exitoso
  function checkSuccessState() {
    return document.querySelector('.text-green-600') !== null;
  }
  
  // Registramos un observador del DOM para detectar cuándo se muestra un mensaje de éxito
  function setupSuccessObserver() {
    // Crear un observador que buscará cambios en el DOM que indiquen inicio de sesión exitoso
    const observer = new MutationObserver(mutations => {
      if (checkSuccessState()) {
        console.log('[BYPASS] Detectado mensaje de éxito - Activando acceso de emergencia');
        enableEmergencyAccess();
      }
    });
    
    // Configuramos la observación
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true
    });
  }
  
  // Función principal que se ejecuta inmediatamente
  function init() {
    console.log('[BYPASS] Inicializando bypass completo...');
    
    // Si estamos en la página de login de emergencia, preparar para detectar el éxito
    if (window.location.pathname === '/emergency-login') {
      console.log('[BYPASS] Página de login de emergencia detectada');
      
      // Ver si ya está la notificación de éxito
      if (checkSuccessState()) {
        enableEmergencyAccess();
      } else {
        // Configurar el observador para detectar cuando aparezca
        setupSuccessObserver();
        
        // También agregar un manejador al botón de inicio de sesión
        setTimeout(() => {
          const loginButton = document.querySelector('button[type="submit"]');
          if (loginButton) {
            console.log('[BYPASS] Agregando handler al botón de login');
            loginButton.addEventListener('click', () => {
              console.log('[BYPASS] Botón de login presionado');
              setTimeout(enableEmergencyAccess, 1000);
            });
          }
        }, 500);
      }
    }
    
    // Si tenemos el token de emergencia en la URL, habilitar acceso
    if (window.location.href.includes('token=emergency')) {
      enableEmergencyAccess();
    }
    
    // Si ya tenemos el token de emergencia, mantenerlo activo
    if (localStorage.getItem(EMERGENCY_TOKEN) === 'true' || 
        sessionStorage.getItem(EMERGENCY_TOKEN) === 'true' ||
        document.cookie.includes(`${EMERGENCY_TOKEN}=true`)) {
      enableEmergencyAccess();
    }
  }
  
  // Ejecutar cuando el DOM esté cargado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
