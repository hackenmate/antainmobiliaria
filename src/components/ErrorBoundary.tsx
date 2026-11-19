import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'Ha ocurrido un error inesperado.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-panel" role="alert">
          <h2>Algo requiere tu atención</h2>
          <p>{this.state.message}</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => this.setState({ hasError: false, message: '' })}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
