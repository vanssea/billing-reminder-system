import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "" };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary menangkap error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-500">
              !
            </div>
            <h1 className="mt-4 text-lg font-semibold text-slate-800">
              Terjadi kesalahan pada aplikasi
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {this.state.message
                ? this.state.message
                : "Terjadi kesalahan tak terduga. Silakan muat ulang halaman."}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Muat ulang tampilan
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}