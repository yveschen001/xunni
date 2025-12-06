import * as AstronomyLib from 'astronomy-engine'; const A = AstronomyLib.default || AstronomyLib; console.log(Object.keys(A).filter(k => k.toLowerCase().includes('tilt') || k.startsWith('e_')));
