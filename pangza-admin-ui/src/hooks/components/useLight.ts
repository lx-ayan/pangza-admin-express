function useLight(text: string, keyword: string = '', color: string = 'var(--td-brand-color)') {
    if (!keyword) return text;
    const reg = new RegExp(`(${keyword})`, 'gi');
    return text.replace(reg, `<span style="color: ${color};">$1</span>`);
}

export default useLight;