interface LoaderSizeProps {
    width: string,
    height: string
}
const LoadingSpinner = ({width, height}: LoaderSizeProps) => {
    return (
            <div className={`w-${width} h-${height} rounded-full animate-spin
                border-2 border-solid border-blue-500 border-t-transparent`}></div>
    );
};

export default LoadingSpinner;