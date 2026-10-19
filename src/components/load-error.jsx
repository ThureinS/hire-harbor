const LoadError = ({
  message = "Unable to load this page. Please refresh and try again.",
}) => (
  <p role="alert" className="p-6 text-destructive">
    {message}
  </p>
);

export default LoadError;
