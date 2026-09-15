/* GLSL for PipelineScene: the progressively lit rail and the packet's fresnel glow. */

export const RAIL_VERT = /* glsl */ `
        attribute float aProg;
        varying float vP;
        void main(){
          vP = aProg;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`;

export const RAIL_FRAG = /* glsl */ `
        uniform float uHead;
        uniform vec3 uA;
        varying float vP;
        void main(){
          float lit  = step(vP, uHead);                       // already travelled
          float glow = smoothstep(0.07, 0.0, abs(vP - uHead)); // the packet's wake
          float a = 0.20 + lit * 0.40 + glow * 0.80;
          gl_FragColor = vec4(mix(uA * 0.55, uA, lit + glow), a);
        }`;

export const GLOW_VERT = /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main(){
            vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position,1.0);
            vV = -mv.xyz;
            gl_Position = projectionMatrix * mv;
          }`;

export const GLOW_FRAG = /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main(){
            float f = pow(1.0 - abs(dot(normalize(vV), vN)), 2.0);
            gl_FragColor = vec4(vec3(0.35, 0.95, 0.6) * f, f * 0.6);
          }`;
