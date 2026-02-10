import '../css/Spinner.css';

const Spinner = ({ fullScreen = false }) => {
    if (fullScreen) {
        return (
            <div className="spinner-overlay">
                <div className="spinner-container">
                    <div className="spinner"></div>
                    <p className="spinner-text">Загрузка...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="spinner-container">
            <div className="spinner"></div>
            <p className="spinner-text">Загрузка...</p>
        </div>
    );
};

export default Spinner;
