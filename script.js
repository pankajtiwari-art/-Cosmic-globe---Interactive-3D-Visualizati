import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ==================== ADVANCED CONSTANTS ====================
const CONFIG = {
    OUTER_RADIUS: 30,
    INNER_RADIUS: 15,
    POINTS_PER_VEIN: 50,
    NUM_DUST_PARTICLES: 3000,
    LERP_SPEED: 0.05,
    VOLCANIC_GLOW: 10.0,
    VEIN_ALPHA_BASE: 0.02,
    VEIN_ALPHA_PULSE: 0.9,
    VEIN_FLOW_SPEED: 0.3,
    DUST_ORBIT_SPEED: 0.02,
    ROTATION_SPEED: 2
};

// ==================== GLOBAL STATE ====================
let scene, camera, renderer, controls, composer, bloomPass;
let mainGroup, veinMesh, earthGlobeMesh, volcanoMesh, dustMesh;
let uniforms = {};
let activeTheme = 0;
let animationSpeed = 1;
let veinFlowSpeed = 0.3;
let rotationSpeed = 2;
let enableBloom = true;
let enableGlow = true;
let autoRotateEnabled = true;
let clock = new THREE.Clock();
let veinDensity = 120;
let particleCount = 3000;

// ==================== ADVANCED 5 THEMES ====================
const themes = [
    {
        name: 'Magma & Cyan',
        core: [new THREE.Color(0.1, 0.0, 0.0), new THREE.Color(0.9, 0.05, 0.0), new THREE.Color(1.0, 0.4, 0.0), new THREE.Color(1.0, 0.9, 0.2)],
        vein: { surface: new THREE.Color(0.0, 0.8, 1.0), coreA: new THREE.Color(0.8, 0.1, 0.0), coreB: new THREE.Color(1.0, 0.6, 0.0) },
        boundary: new THREE.Color(0.0, 1.5, 3.0),
        map: new THREE.Color(0x006699),
        glass: new THREE.Color(0x001133),
        volcano: new THREE.Color(0xff5500),
        dust: new THREE.Color(0x223355),
        bg: new THREE.Color(0x010102)
    },
    {
        name: 'Neon Void',
        core: [new THREE.Color(0.05, 0.0, 0.1), new THREE.Color(0.5, 0.0, 0.5), new THREE.Color(1.0, 0.0, 0.8), new THREE.Color(1.0, 0.5, 1.0)],
        vein: { surface: new THREE.Color(0.2, 1.0, 0.2), coreA: new THREE.Color(0.8, 0.0, 0.8), coreB: new THREE.Color(0.0, 0.8, 1.0) },
        boundary: new THREE.Color(2.0, 0.0, 1.5), 
        map: new THREE.Color(0x330055),
        glass: new THREE.Color(0x110022),
        volcano: new THREE.Color(0x00ff00), 
        dust: new THREE.Color(0x2a0044),
        bg: new THREE.Color(0x020005)
    },
    {
        name: 'Solar Flare',
        core: [new THREE.Color(0.05, 0.02, 0.0), new THREE.Color(0.8, 0.4, 0.0), new THREE.Color(1.0, 0.8, 0.2), new THREE.Color(1.5, 1.5, 1.5)],
        vein: { surface: new THREE.Color(0.0, 0.3, 2.0), coreA: new THREE.Color(1.0, 0.8, 0.0), coreB: new THREE.Color(1.0, 0.3, 0.0) },
        boundary: new THREE.Color(1.5, 1.5, 2.5), 
        map: new THREE.Color(0x112244),
        glass: new THREE.Color(0x221100),
        volcano: new THREE.Color(0xffffff),
        dust: new THREE.Color(0x443311),
        bg: new THREE.Color(0x000103)
    },
    {
        name: 'Deep Ocean',
        core: [new THREE.Color(0.0, 0.1, 0.1), new THREE.Color(0.0, 0.3, 0.6), new THREE.Color(0.0, 0.6, 0.8), new THREE.Color(0.2, 0.8, 1.0)],
        vein: { surface: new THREE.Color(0.0, 1.0, 0.5), coreA: new THREE.Color(0.0, 0.5, 1.0), coreB: new THREE.Color(0.2, 0.8, 1.0) },
        boundary: new THREE.Color(0.0, 2.0, 3.0), 
        map: new THREE.Color(0x003366),
        glass: new THREE.Color(0x000055),
        volcano: new THREE.Color(0x00ff88),
        dust: new THREE.Color(0x113355),
        bg: new THREE.Color(0x000a0f)
    },
    {
        name: 'Cosmic Nebula',
        core: [new THREE.Color(0.2, 0.0, 0.1), new THREE.Color(1.0, 0.0, 0.5), new THREE.Color(1.0, 0.3, 0.8), new THREE.Color(1.0, 0.6, 1.0)],
        vein: { surface: new THREE.Color(1.0, 0.2, 0.8), coreA: new THREE.Color(1.0, 0.0, 1.0), coreB: new THREE.Color(0.5, 0.0, 1.0) },
        boundary: new THREE.Color(2.0, 0.5, 1.5), 
        map: new THREE.Color(0x550055),
        glass: new THREE.Color(0x220033),
        volcano: new THREE.Color(0xff1493),
        dust: new THREE.Color(0x440055),
        bg: new THREE.Color(0x0a000f)
    }
];

// ==================== ADVANCED SIMPLEX NOISE ====================
const snoise3GLSL = `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy; 
        vec3 x3 = x0 - D.yyy;      
        i = mod289(i);
        vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857; 
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }
`;

// ==================== ERROR HANDLING ====================
function showError(message) {
    console.error('🔴 Error:', message);
    const errorScreen = document.getElementById('errorScreen');
    const errorMsg = document.getElementById('errorMessage');
    errorMsg.textContent = message;
    errorScreen.style.display = 'flex';
}

window.addEventListener('error', (event) => {
    showError(`${event.message} at line ${event.lineno}`);
});

// ==================== INITIALIZATION ====================
async function init() {
    try {
        console.log('🚀 Initializing Advanced Cosmic Earth...');
        
        setupScene();
        generateGeometry();
        setupUI();
        setupKeyboardShortcuts();
        animate();
        
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            loadingScreen.classList.add('hidden');
        }, 500);
        
        console.log('✅ Advanced Cosmic Earth initialized successfully!');
    } catch (error) {
        showError(`Initialization failed: ${error.message}`);
    }
}

// ==================== ADVANCED SCENE SETUP ====================
function setupScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(themes[0].bg, 0.0008);

    const width = window.innerWidth;
    const height = window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.set(50, 40, 50);

    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer({ 
        canvas,
        antialias: true,
        precision: 'highp',
        powerPreference: 'high-performance',
        stencil: false,
        depth: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotateEnabled;
    controls.autoRotateSpeed = rotationSpeed;
    controls.enableZoom = true;

    setupPostProcessing();

    mainGroup = new THREE.Group();
    scene.add(mainGroup);

    console.log('✅ Scene setup complete');
}

function setupPostProcessing() {
    const renderScene = new RenderPass(scene, camera);
    
    bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,
        0.4,
        0.85
    );
    bloomPass.enabled = enableBloom;

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
}

// ==================== ADVANCED GEOMETRY GENERATION ====================
function generateGeometry() {
    try {
        if (veinMesh) mainGroup.remove(veinMesh);
        if (earthGlobeMesh) mainGroup.remove(earthGlobeMesh);
        if (volcanoMesh) mainGroup.remove(volcanoMesh);
        if (dustMesh) mainGroup.remove(dustMesh);

        createUniforms();
        generateVeins();
        generateEarthGlobe();
        generateVolcanoes();
        generateDust();

        console.log('✅ Geometry generated');
    } catch (error) {
        showError(`Geometry generation failed: ${error.message}`);
    }
}

function createUniforms() {
    uniforms = {
        time: { value: 0 },
        tEarth: { value: generateEarthTexture() },
        cDark: { value: themes[0].core[0].clone() },
        cRed: { value: themes[0].core[1].clone() },
        cOrange: { value: themes[0].core[2].clone() },
        cYellow: { value: themes[0].core[3].clone() },
        cSurface: { value: themes[0].vein.surface.clone() },
        cCoreA: { value: themes[0].vein.coreA.clone() },
        cCoreB: { value: themes[0].vein.coreB.clone() },
        boundaryColor: { value: themes[0].boundary.clone() },
        veinFlowSpeed: { value: veinFlowSpeed },
        glowEnabled: { value: enableGlow }
    };
}

function generateEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() > 0.7 ? 255 : 0;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    return texture;
}

function generateVeins() {
    const veinPositions = [];
    const veinProgress = [];
    const veinOffsets = [];
    const veinRands = [];

    for (let i = 0; i < veinDensity; i++) {
        const startAngle = Math.random() * Math.PI * 2;
        const startElev = (Math.random() - 0.5) * Math.PI;
        const endAngle = Math.random() * Math.PI * 2;
        const endElev = (Math.random() - 0.5) * Math.PI;

        const start = new THREE.Vector3(
            Math.cos(startElev) * Math.cos(startAngle) * CONFIG.OUTER_RADIUS,
            Math.sin(startElev) * CONFIG.OUTER_RADIUS,
            Math.cos(startElev) * Math.sin(startAngle) * CONFIG.OUTER_RADIUS
        );

        const end = new THREE.Vector3(
            Math.cos(endElev) * Math.cos(endAngle) * CONFIG.OUTER_RADIUS,
            Math.sin(endElev) * CONFIG.OUTER_RADIUS,
            Math.cos(endElev) * Math.sin(endAngle) * CONFIG.OUTER_RADIUS
        );

        const mid = start.clone().add(end).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(CONFIG.OUTER_RADIUS * 0.55);
        
        const tangent = new THREE.Vector3().crossVectors(start, new THREE.Vector3(0, 1, 0)).normalize();
        const bitangent = new THREE.Vector3().crossVectors(start, tangent).normalize();
        
        mid.add(tangent.multiplyScalar((Math.random() - 0.5) * 6));
        mid.add(bitangent.multiplyScalar((Math.random() - 0.5) * 6));

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(CONFIG.POINTS_PER_VEIN);
        const offset = Math.random(); 
        const randSeed = Math.random();

        for (let j = 0; j < CONFIG.POINTS_PER_VEIN; j++) {
            veinPositions.push(points[j].x, points[j].y, points[j].z);
            veinPositions.push(points[j + 1].x, points[j + 1].y, points[j + 1].z);
            veinProgress.push(j / CONFIG.POINTS_PER_VEIN, (j + 1) / CONFIG.POINTS_PER_VEIN);
            veinOffsets.push(offset, offset);
            veinRands.push(randSeed, randSeed);
        }
    }

    const veinGeo = new THREE.BufferGeometry();
    veinGeo.setAttribute('position', new THREE.Float32BufferAttribute(veinPositions, 3));
    veinGeo.setAttribute('progress', new THREE.Float32BufferAttribute(veinProgress, 1));
    veinGeo.setAttribute('offset', new THREE.Float32BufferAttribute(veinOffsets, 1));
    veinGeo.setAttribute('randomSeed', new THREE.Float32BufferAttribute(veinRands, 1));

    const veinMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
            attribute float progress;
            attribute float offset;
            attribute float randomSeed;
            varying float vProgress;
            varying float vOffset;
            varying float vRandom;
            void main() {
                vProgress = progress;
                vOffset = offset;
                vRandom = randomSeed;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 cSurface;
            uniform vec3 cCoreA;
            uniform vec3 cCoreB;
            uniform float veinFlowSpeed;
            uniform bool glowEnabled;

            varying float vProgress;
            varying float vOffset;
            varying float vRandom;
            
            void main() {
                vec3 targetCoreColor = mix(cCoreA, cCoreB, vRandom);
                vec3 color = mix(cSurface, targetCoreColor, pow(vProgress, 1.5));

                float speed = veinFlowSpeed;
                float phase = vProgress - time * speed + vOffset * 10.0;
                float flow = fract(phase);
                float pulse = exp(-flow * 10.0);
                
                vec3 pulseGlow = color * pulse * 10.0; 
                if(glowEnabled) {
                    color += pulseGlow;
                }

                float alphaBase = 0.02; 
                float alphaPulse = pulse * 0.9;
                float alpha = alphaBase + alphaPulse;
                
                alpha *= smoothstep(0.0, 0.05, vProgress) * smoothstep(1.0, 0.8, vProgress);

                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    veinMesh = new THREE.LineSegments(veinGeo, veinMat);
    mainGroup.add(veinMesh);
}

function generateEarthGlobe() {
    const earthGlobeGeo = new THREE.SphereGeometry(CONFIG.OUTER_RADIUS * 0.995, 128, 128);
    const earthGlobeMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tEarth;
            uniform vec3 boundaryColor;
            varying vec2 vUv;
            varying vec3 vNormal;

            void main() {
                vec2 texel = vec2(1.5 / 2048.0, 1.5 / 1024.0); 
                
                float c = texture2D(tEarth, vUv).r;
                float r = texture2D(tEarth, vUv + vec2(texel.x, 0.0)).r;
                float u = texture2D(tEarth, vUv + vec2(0.0, texel.y)).r;
                float l = texture2D(tEarth, vUv + vec2(-texel.x, 0.0)).r;
                float d = texture2D(tEarth, vUv + vec2(0.0, -texel.y)).r;
                
                float edge = abs(4.0 * c - r - u - l - d);
                float outline = smoothstep(0.1, 0.8, edge);
                
                vec3 color = boundaryColor * outline;
                color *= 2.5;
                
                float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
                color += boundaryColor * fresnel * 0.5;
                
                float alpha = outline * 0.8 + fresnel * 0.2;
                
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    earthGlobeMesh = new THREE.Mesh(earthGlobeGeo, earthGlobeMat);
    mainGroup.add(earthGlobeMesh);
}

function generateVolcanoes() {
    const volcanoPoints = [];
    
    for (let i = 0; i < veinDensity; i++) {
        const angle = (i / veinDensity) * Math.PI * 2;
        const elev = (Math.random() - 0.5) * Math.PI;
        volcanoPoints.push(new THREE.Vector3(
            Math.cos(elev) * Math.cos(angle) * CONFIG.OUTER_RADIUS,
            Math.sin(elev) * CONFIG.OUTER_RADIUS,
            Math.cos(elev) * Math.sin(angle) * CONFIG.OUTER_RADIUS
        ));
    }

    const volcanoGeo = new THREE.BufferGeometry().setFromPoints(volcanoPoints);
    const volcanoMat = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: themes[0].volcano.clone() },
            size: { value: 7.0 * window.devicePixelRatio },
            time: uniforms.time,
            glowEnabled: uniforms.glowEnabled
        },
        vertexShader: `
            uniform float size;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (20.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            uniform float time;
            uniform bool glowEnabled;
            void main() {
                vec2 pt = gl_PointCoord - vec2(0.5);
                if(abs(pt.x) > 0.35 || abs(pt.y) > 0.35) discard;
                
                float throb = sin(time * 3.0 + gl_FragCoord.x) * 0.5 + 0.5;
                float glow = glowEnabled ? 1.5 + throb : 1.0 + throb * 0.3;
                gl_FragColor = vec4(color * glow, 0.9);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    volcanoMesh = new THREE.Points(volcanoGeo, volcanoMat);
    mainGroup.add(volcanoMesh);
}

function generateDust() {
    const dustPositions = [];
    
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = CONFIG.OUTER_RADIUS + Math.random() * 30;
        
        dustPositions.push(
            Math.sin(phi) * Math.cos(theta) * r,
            Math.cos(phi) * r,
            Math.sin(phi) * Math.sin(theta) * r
        );
    }

    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));

    const dustMat = new THREE.PointsMaterial({
        color: themes[0].dust,
        size: 0.5,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.3
    });

    dustMesh = new THREE.Points(dustGeo, dustMat);
    mainGroup.add(dustMesh);
}

// ==================== ADVANCED UI SETUP ====================
function setupUI() {
    setupThemeSwitcher();
    setupVisualizationControls();
    setupAnimationControls();
    setupEffectsControls();
    setupColorControls();
    setupCameraControls();
    setupSystemControls();
}

function setupThemeSwitcher() {
    const thumbs = document.querySelectorAll('.thumb');
    thumbs.forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            thumbs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            activeTheme = parseInt(e.target.getAttribute('data-theme'));
            const color = e.target.getAttribute('data-color');
            document.documentElement.style.setProperty('--theme-color', color);
        });
    });
}

function setupVisualizationControls() {
    // Show/Hide controls
    document.getElementById('showVeins').addEventListener('change', (e) => {
        if (veinMesh) veinMesh.visible = e.target.checked;
    });

    document.getElementById('showGlobe').addEventListener('change', (e) => {
        if (earthGlobeMesh) earthGlobeMesh.visible = e.target.checked;
    });

    document.getElementById('showVolcano').addEventListener('change', (e) => {
        if (volcanoMesh) volcanoMesh.visible = e.target.checked;
    });

    document.getElementById('showDust').addEventListener('change', (e) => {
        if (dustMesh) dustMesh.visible = e.target.checked;
    });

    // Vein density
    document.getElementById('veinDensity').addEventListener('change', (e) => {
        veinDensity = parseInt(e.target.value);
        document.getElementById('densityValue').textContent = veinDensity;
        generateGeometry();
    });

    // Particle count
    document.getElementById('particleCount').addEventListener('change', (e) => {
        particleCount = parseInt(e.target.value);
        document.getElementById('particleValue').textContent = particleCount;
        generateGeometry();
    });
}

function setupAnimationControls() {
    document.getElementById('autoRotate').addEventListener('change', (e) => {
        autoRotateEnabled = e.target.checked;
        controls.autoRotate = autoRotateEnabled;
    });

    document.getElementById('animationSpeed').addEventListener('input', (e) => {
        animationSpeed = parseFloat(e.target.value);
        document.getElementById('speedValue').textContent = animationSpeed.toFixed(1) + 'x';
    });

    document.getElementById('veinSpeed').addEventListener('input', (e) => {
        veinFlowSpeed = parseFloat(e.target.value);
        document.getElementById('veinSpeedValue').textContent = veinFlowSpeed.toFixed(1) + 'x';
        if (uniforms.veinFlowSpeed) {
            uniforms.veinFlowSpeed.value = veinFlowSpeed;
        }
    });

    document.getElementById('rotationSpeed').addEventListener('input', (e) => {
        rotationSpeed = parseFloat(e.target.value);
        document.getElementById('rotSpeedValue').textContent = rotationSpeed.toFixed(1) + 'x';
        controls.autoRotateSpeed = rotationSpeed;
    });
}

function setupEffectsControls() {
    document.getElementById('bloomEffect').addEventListener('change', (e) => {
        enableBloom = e.target.checked;
        bloomPass.enabled = enableBloom;
    });

    document.getElementById('bloomStrength').addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        document.getElementById('bloomValue').textContent = value.toFixed(1) + 'x';
        bloomPass.strength = value;
    });

    document.getElementById('glowEffect').addEventListener('change', (e) => {
        enableGlow = e.target.checked;
        if (uniforms.glowEnabled) {
            uniforms.glowEnabled.value = enableGlow;
        }
    });

    document.getElementById('fogDensity').addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        document.getElementById('fogValue').textContent = value.toFixed(4);
        scene.fog.density = value;
    });
}

function setupColorControls() {
    document.getElementById('veinColor').addEventListener('change', (e) => {
        const color = new THREE.Color(e.target.value);
        if (uniforms.cSurface) uniforms.cSurface.value.copy(color);
    });

    document.getElementById('coreColor').addEventListener('change', (e) => {
        const color = new THREE.Color(e.target.value);
        if (uniforms.cCoreA) uniforms.cCoreA.value.copy(color);
        if (uniforms.cCoreB) uniforms.cCoreB.value.copy(color);
    });

    document.getElementById('dustColor').addEventListener('change', (e) => {
        const color = new THREE.Color(e.target.value);
        if (dustMesh) dustMesh.material.color.copy(color);
    });
}

function setupCameraControls() {
    document.getElementById('dampingEnabled').addEventListener('change', (e) => {
        controls.enableDamping = e.target.checked;
    });

    document.getElementById('zoomSpeed').addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        document.getElementById('zoomValue').textContent = value.toFixed(1) + 'x';
        controls.zoomSpeed = value;
    });

    document.getElementById('resetView').addEventListener('click', () => {
        camera.position.set(50, 40, 50);
        controls.target.set(0, 0, 0);
        controls.update();
    });
}

function setupSystemControls() {
    document.getElementById('showStats').addEventListener('change', (e) => {
        document.getElementById('statsPanel').style.display = e.target.checked ? 'flex' : 'none';
    });

    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Fullscreen error: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    document.getElementById('resetAll').addEventListener('click', () => {
        if (confirm('Reset all settings to defaults?')) {
            location.reload();
        }
    });

    // Shortcuts toggle
    document.getElementById('toggleShortcuts').addEventListener('click', (e) => {
        const section = document.getElementById('shortcutsSection');
        const isVisible = section.style.display !== 'none';
        section.style.display = isVisible ? 'none' : 'block';
        e.target.classList.toggle('active', !isVisible);
    });

    // Controls toggle
    document.getElementById('toggleControls').addEventListener('click', (e) => {
        const content = document.querySelector('.control-content');
        const isOpen = content.style.maxHeight !== '0px';
        content.style.maxHeight = isOpen ? '0px' : '1000px';
        e.target.textContent = isOpen ? '+' : '−';
    });
}

// ==================== KEYBOARD SHORTCUTS ====================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                autoRotateEnabled = !autoRotateEnabled;
                controls.autoRotate = autoRotateEnabled;
                document.getElementById('autoRotate').checked = autoRotateEnabled;
                break;
            case 'KeyB':
                enableBloom = !enableBloom;
                bloomPass.enabled = enableBloom;
                document.getElementById('bloomEffect').checked = enableBloom;
                break;
            case 'KeyV':
                const showVeins = !veinMesh.visible;
                veinMesh.visible = showVeins;
                document.getElementById('showVeins').checked = showVeins;
                break;
            case 'KeyD':
                const showDust = !dustMesh.visible;
                dustMesh.visible = showDust;
                document.getElementById('showDust').checked = showDust;
                break;
            case 'KeyG':
                const showGlobe = !earthGlobeMesh.visible;
                earthGlobeMesh.visible = showGlobe;
                document.getElementById('showGlobe').checked = showGlobe;
                break;
            case 'KeyL':
                enableGlow = !enableGlow;
                uniforms.glowEnabled.value = enableGlow;
                document.getElementById('glowEffect').checked = enableGlow;
                break;
            case 'KeyR':
                camera.position.set(50, 40, 50);
                controls.target.set(0, 0, 0);
                controls.update();
                break;
            case 'KeyS':
                const statsPanel = document.getElementById('statsPanel');
                const isVisible = statsPanel.style.display !== 'none';
                statsPanel.style.display = isVisible ? 'none' : 'flex';
                document.getElementById('showStats').checked = !isVisible;
                break;
            case 'KeyF':
                e.preventDefault();
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
                break;
            case 'KeyH':
                const section = document.getElementById('shortcutsSection');
                const hidden = section.style.display === 'none';
                section.style.display = hidden ? 'block' : 'none';
                document.getElementById('toggleShortcuts').classList.toggle('active', hidden);
                break;
            case 'Equal':
            case 'Plus':
                e.preventDefault();
                animationSpeed = Math.min(animationSpeed + 0.1, 3);
                document.getElementById('animationSpeed').value = animationSpeed;
                document.getElementById('speedValue').textContent = animationSpeed.toFixed(1) + 'x';
                break;
            case 'Minus':
                e.preventDefault();
                animationSpeed = Math.max(animationSpeed - 0.1, 0);
                document.getElementById('animationSpeed').value = animationSpeed;
                document.getElementById('speedValue').textContent = animationSpeed.toFixed(1) + 'x';
                break;
        }
    });
}

// ==================== ADVANCED ANIMATION LOOP ====================
let frameCount = 0;
let lastFpsUpdate = 0;

function animate() {
    requestAnimationFrame(animate);

    try {
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        uniforms.time.value = elapsedTime * animationSpeed;

        const tgt = themes[activeTheme];
        
        uniforms.cDark.value.lerp(tgt.core[0], CONFIG.LERP_SPEED);
        uniforms.cRed.value.lerp(tgt.core[1], CONFIG.LERP_SPEED);
        uniforms.cOrange.value.lerp(tgt.core[2], CONFIG.LERP_SPEED);
        uniforms.cYellow.value.lerp(tgt.core[3], CONFIG.LERP_SPEED);

        uniforms.cSurface.value.lerp(tgt.vein.surface, CONFIG.LERP_SPEED);
        uniforms.cCoreA.value.lerp(tgt.vein.coreA, CONFIG.LERP_SPEED);
        uniforms.cCoreB.value.lerp(tgt.vein.coreB, CONFIG.LERP_SPEED);

        uniforms.boundaryColor.value.lerp(tgt.boundary, CONFIG.LERP_SPEED);

        if (volcanoMesh) {
            volcanoMesh.material.uniforms.color.value.lerp(tgt.volcano, CONFIG.LERP_SPEED);
        }

        if (dustMesh) {
            dustMesh.material.color.lerp(tgt.dust, CONFIG.LERP_SPEED);
            dustMesh.rotation.y += CONFIG.DUST_ORBIT_SPEED * delta;
        }

        scene.fog.color.lerp(tgt.bg, CONFIG.LERP_SPEED);
        renderer.setClearColor(scene.fog.color);

        controls.update();
        
        if (enableBloom) {
            composer.render();
        } else {
            renderer.render(scene, camera);
        }

        frameCount++;
        const now = performance.now();
        if (now >= lastFpsUpdate + 1000) {
            const fps = Math.round(frameCount * 1000 / (now - lastFpsUpdate));
            document.getElementById('fps').textContent = fps;
            
            if (performance.memory) {
                const memory = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
                document.getElementById('memory').textContent = memory;
            }

            if (veinMesh && veinMesh.visible) {
                const vertices = veinMesh.geometry.attributes.position.count;
                document.getElementById('vertices').textContent = vertices.toLocaleString();
                const triangles = (vertices / 3).toLocaleString();
                document.getElementById('triangles').textContent = triangles;
            }

            frameCount = 0;
            lastFpsUpdate = now;
        }
    } catch (error) {
        console.error('Animation error:', error);
    }
}

// ==================== WINDOW EVENTS ====================
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
});

window.addEventListener('beforeunload', () => {
    if (veinMesh) veinMesh.geometry.dispose();
    if (earthGlobeMesh) earthGlobeMesh.geometry.dispose();
    if (volcanoMesh) volcanoMesh.geometry.dispose();
    if (dustMesh) dustMesh.geometry.dispose();
    renderer.dispose();
    composer.dispose();
});

// ==================== START APPLICATION ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
