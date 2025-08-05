import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const ToastProvider = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      pauseOnHover
      theme="colored"
      className="custom-toast-container"
    />
  );
};

export default ToastProvider;
