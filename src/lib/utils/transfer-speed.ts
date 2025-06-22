export const formatSpeed = (speed: number): string => {
    const units = ['', 'K', 'M', 'G'];
    let unitIndex = 0;

    while (speed >= 1024 && unitIndex < units.length - 1) {
        speed /= 1024;
        unitIndex++;
    }

    return `${speed.toFixed(0)} ${units[unitIndex]}bit/s`;
};