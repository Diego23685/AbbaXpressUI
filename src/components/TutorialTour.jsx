import React from 'react';
import * as JoyrideModule from 'react-joyride';

const Joyride = JoyrideModule.default || JoyrideModule.Joyride || JoyrideModule;
const STATUS = JoyrideModule.STATUS;

export default function TutorialTour({ run, setRun }) {
  const pasos = [
    {
      target: 'aside',
      content: (
        <div style={{ textAlign: 'center' }}>
          <img 
            src="/tuto.jpg" 
            alt="Bienvenida Abba Xpress ERP" 
            style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px' }} 
          />
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4' }}>
            ¡Bienvenido a Abba Xpress ERP! Este menú lateral es tu panel de navegación principal entre sucursales y módulos.
          </p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: 'nav a[href="/"]',
      content: (
        <div style={{ textAlign: 'center' }}>
          <img 
            src="/tuto2.jpg" 
            alt="Recepción de Carga" 
            style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px' }} 
          />
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4' }}>
            Aquí realizas la Recepción de Carga: registras paquetes, pesajes, clientes y calculas subtotales automáticamente.
          </p>
        </div>
      ),
    },
    {
      target: 'nav a[href="/facturacion"]',
      content: (
        <div style={{ textAlign: 'center' }}>
          <img 
            src="/tuto3.jpg" 
            alt="Cuentas y Facturación" 
            style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px' }} 
          />
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4' }}>
            En Cuentas & Facturación controlas los créditos, el estado de las cargas y realizas los cobros en mostrador o multimoneda.
          </p>
        </div>
      ),
    },
    {
      target: 'nav a[href="/transito"]',
      content: (
        <div style={{ textAlign: 'center' }}>
          <img 
            src="/tuto4.jpg" 
            alt="Carga en Tránsito" 
            style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px' }} 
          />
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4' }}>
            Módulo de Carga en Tránsito: ideal para confirmar el arribo físico y manifiestos de bultos entre Managua y León.
          </p>
        </div>
      ),
    },
    {
      target: 'nav a[href="/finanzas"]',
      content: (
        <div style={{ textAlign: 'center' }}>
          <img 
            src="/tuto5.jpg" 
            alt="Finanzas" 
            style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px' }} 
          />
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4' }}>
            Control de Gastos & Utilidades Netas reales deduciendo costos de proveedor y gastos operativos por sede.
          </p>
        </div>
      ),
    },
    {
      target: 'nav a[href="/exportacion"]',
      content: (
        <div style={{ textAlign: 'center' }}>
          <img 
            src="/tuto6.jpg" 
            alt="Exportación a USA" 
            style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px' }} 
          />
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4' }}>
            Gestión de Exportaciones a USA a través de FedEx, con cálculo de tarifas por peso y recargos por estado.
          </p>
        </div>
      ),
    },
    {
      target: 'nav a[href="/clientes"]',
      content: (
        <div style={{ textAlign: 'center' }}>
          <img 
            src="/tuto7.jpg" 
            alt="Directorio de Clientes" 
            style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px' }} 
          />
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4' }}>
            Directorio de Clientes: administra tanto a tus clientes finales como a las sucursales mayoristas B2B.
          </p>
        </div>
      ),
    }
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS?.FINISHED, STATUS?.SKIPPED, 'finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('abba_tutorial_visto', 'true');
    }
  };

  return (
    <Joyride
      steps={pasos}
      run={run}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#f97316',
          zIndex: 1000,
        },
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Omitir tour',
      }}
    />
  );
}