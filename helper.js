module.exports = {
    sleep(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    },
    tryJSON(str) {
        try {
            return JSON.parse(str);
        } catch (error) {
            return null;
        }
    }
}