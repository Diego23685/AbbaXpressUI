import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import Layout from './components/Layout';
import Login from './components/Login';
import RecepcionCarga from './components/RecepcionCarga';
import ControlFacturacion from './components/ControlFacturacion';
import GastosOperativos from './components/GastosOperativos';
import ExportacionFedEx from './components/ExportacionFedEx';
import GestionClientes from './components/GestionClientes';
import ConfiguracionTarifas from './components/ConfiguracionTarifas';
import GestionUsuarios from './components/GestionUsuarios'; 
import ImpresionRotulos from './components/ImpresionRotulos';
import RecepcionTransferencias from './components/RecepcionTransferencias';
import ReportesFinancieros from './components/ReportesFinancieros'; 
import AuditoriaMovimientos from './components/AuditoriaMovimientos';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta Pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas Privadas Protegidas bajo Layout */}
          <Route
            path="/"
            element={
              <RutaProtegida>
                <Layout />
              </RutaProtegida>
            }
          >
            {/* Página Principal: Recepción de Carga */}
            <Route index element={<RecepcionCarga />} />
            
            {/* Módulos Operativos y Financieros */}
            <Route path="/recepcion" element={<RecepcionCarga />} />
            <Route path="/facturacion" element={<ControlFacturacion />} />
            <Route path="/finanzas" element={<GastosOperativos />} />
            <Route path="/exportacion" element={<ExportacionFedEx />} />
            <Route path="/clientes" element={<GestionClientes />} />
            <Route path="/usuarios" element={<GestionUsuarios />} /> {/* <-- 2. Ruta agregada */}
            <Route path="/configuracion" element={<ConfiguracionTarifas />} />
            <Route path="/rotulos" element={<ImpresionRotulos />} />
            <Route path="/transito" element={<RecepcionTransferencias />} />
            <Route path="/reportes" element={<ReportesFinancieros />} />
            <Route path="/auditoria" element={<AuditoriaMovimientos />} />
          </Route>

          {/* Redirección por defecto para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}