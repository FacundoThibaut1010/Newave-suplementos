import React from 'react';

interface State {
  error: Error | null;
}

// Si alguna pantalla del admin tira un error, mostramos el mensaje en vez de dejar la página en blanco
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error en el panel de administración:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-xl p-10 border border-gray-100 text-center">
            <h1 className="text-2xl font-black text-[#111214] tracking-tighter mb-2">Algo salió mal</h1>
            <p className="text-sm text-gray-500 mb-6">Esta pantalla tuvo un error. Copiá el mensaje de abajo si necesitás ayuda.</p>
            <pre className="text-left text-xs bg-red-50 text-red-700 rounded-xl p-4 overflow-auto mb-6 whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              className="bg-black text-white rounded-full px-8 py-3 font-black uppercase tracking-widest text-xs"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
