export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          position: 'relative',
          width: '80px',
          height: '80px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            opacity: 1,
            borderRadius: '50%',
            animation: 'lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite',
            width: '100%',
            height: '100%',
          }}
        ></div>
        <div
          style={{
            position: 'absolute',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            opacity: 1,
            borderRadius: '50%',
            animation: 'lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite',
            width: '100%',
            height: '100%',
            animationDelay: '-0.5s',
          }}
        ></div>
      </div>

      <p style={{ marginTop: '24px', fontSize: '16px', opacity: 0.9 }}>
        Loading...
      </p>

      <style>{`
        @keyframes lds-ripple {
          0% {
            top: 36px;
            left: 36px;
            width: 0;
            height: 0;
            opacity: 1;
          }
          100% {
            top: 0px;
            left: 0px;
            width: 72px;
            height: 72px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
