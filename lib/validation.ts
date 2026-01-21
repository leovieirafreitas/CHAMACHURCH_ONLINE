export function isValidCPF(cpf: string): boolean {
    if (typeof cpf !== 'string') return false;
    cpf = cpf.replace(/[^\d]+/g, '');

    // Check length and repeating digits (e.g. 111.111.111-11)
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

    const values = cpf.split('').map(el => +el);

    // Validate first digit
    const rest = (count: number) => (values.slice(0, count - 12)
        .reduce((s, el, i) => s + el * (count - i), 0) * 10) % 11 % 10;

    return rest(10) === values[9] && rest(11) === values[10];
}
