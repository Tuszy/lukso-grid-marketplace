// Styling
import "./App.css";

// Provider
import { useUpProvider } from "./context/UpProvider";

// Icon
import LuksoLogo from "./assets/lukso logo.svg";

// View
import Main from "./view/Main";

// Toast
import { Bounce, ToastContainer } from "react-toastify";
import { PropsWithChildren, Suspense } from "react";

const LoadingBackdrop = ({
  children,
  background,
}: PropsWithChildren<{ background?: string }>) => (
  <div
    className="fixed inset-0 bg-[rgba(0,0,0,0.75)] z-10 flex flex-col items-center justify-center gap-4 transition-all select-none backdrop-blur-sm"
    style={{ background }}
  >
    <img
      draggable={false}
      src={LuksoLogo}
      width={64}
      height={64}
      className="animate-[spin_3s_linear_infinite] opacity-100"
    />
    <div className="text-white text-3xl font-bold">{children}</div>
  </div>
);

function App() {
  const upContext = useUpProvider();

  return (
    <>
      {upContext.contextAccounts[0] && (
        <Suspense
          fallback={
            <LoadingBackdrop background="rgba(0,0,0,0.9)">
              LOADING NFTs
            </LoadingBackdrop>
          }
        >
          <Main />
        </Suspense>
      )}
      {upContext.isImmersed && (
        <div className="absolute top-[50%] left-[50%] w-2 h-2 rounded-full translate-x-[50%] translate-y-[50%] border-2 border-white" />
      )}
      {!upContext.isImmersed && !upContext.isWaitingForTx && (
        <div className="fixed top-0 p-4 text-white text-5xl left-0 right-0 bg-[rgba(0,0,0,0.65)] z-10 grid place-content-center transition-all select-none backdrop-blur-md">
          CLICK TO IMMERSE
        </div>
      )}
      {upContext.isWaitingForTx && <LoadingBackdrop />}
      <ToastContainer
        className={"z-50 text-xl font-bold"}
        closeButton={false}
        closeOnClick={false}
        autoClose={3000}
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        theme="colored"
        transition={Bounce}
        draggable={false}
      />
    </>
  );
}

export default App;
