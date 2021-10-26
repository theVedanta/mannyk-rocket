// there are 3 parts to this
//
// Scene:           Setups and manages threejs rendering
// loadModel:       Loads the 3d obj file
// setupAnimation:  Creates all the GSAP
//                  animtions and scroll triggers

// first we call loadModel, once complete we call
// setupAnimation which creates a new Scene

class Scene {
    constructor(model) {
        this.views = [
            { bottom: 0, height: 1 },
            { bottom: 0, height: 0 },
        ];

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);

        document.body.appendChild(this.renderer.domElement);

        // scene

        this.scene = new THREE.Scene();

        for (var ii = 0; ii < this.views.length; ++ii) {
            var view = this.views[ii];
            var camera = new THREE.PerspectiveCamera(
                45,
                window.innerWidth / window.innerHeight,
                1,
                2000
            );
            camera.position.fromArray([0, 0, 180]);
            camera.layers.disableAll();
            camera.layers.enable(ii);
            view.camera = camera;
            camera.lookAt(new THREE.Vector3(0, 5, 0));
        }

        //light

        this.light = new THREE.PointLight(0xffffff, 0.75);
        this.light.position.z = 150;
        this.light.position.x = 70;
        this.light.position.y = -20;
        this.scene.add(this.light);

        this.softLight = new THREE.AmbientLight(0xffffff, 1.5);
        this.scene.add(this.softLight);

        // group

        this.onResize();
        window.addEventListener("resize", this.onResize, false);

        this.modelGroup = new THREE.Group();

        for (let child of model.children) {
            var edges = new THREE.EdgesGeometry(child.geometry);
            let line = new THREE.LineSegments(edges);
            line.material.depthTest = false;
            line.material.opacity = 0.5;
            line.material.transparent = true;
            line.position.x = 0.5;
            line.position.z = -1;
            line.position.y = 0.2;
            line.layers.set(1);
            // line.scale.set(2, 2, 2);
            this.modelGroup.add(line);
        }

        model.layers.set(0);

        // model.scale.set(2, 2, 2);

        this.modelGroup.add(model);
        this.scene.add(this.modelGroup);
    }

    render = () => {
        for (var ii = 0; ii < this.views.length; ++ii) {
            var view = this.views[ii];
            var camera = view.camera;

            var bottom = Math.floor(this.h * view.bottom);
            var height = Math.floor(this.h * view.height);

            this.renderer.setViewport(0, 0, this.w, this.h);
            this.renderer.setScissor(0, bottom, this.w, height);
            this.renderer.setScissorTest(true);

            camera.aspect = this.w / this.h;
            this.renderer.render(this.scene, camera);
        }
    };

    onResize = () => {
        this.w = window.innerWidth;
        this.h = window.innerHeight;

        for (var ii = 0; ii < this.views.length; ++ii) {
            var view = this.views[ii];
            var camera = view.camera;
            camera.aspect = this.w / this.h;
            let camZ = (screen.width - this.w * 1) / 3;
            camera.position.z = camZ < 180 ? 180 : camZ;
            camera.updateProjectionMatrix();
        }

        this.renderer.setSize(this.w, this.h);
        this.render();
    };
}

function loadModel() {
    gsap.registerPlugin(ScrollTrigger);
    // gsap.registerPlugin(DrawSVGPlugin);
    // gsap.set("#line-length", { drawSVG: 0 });
    // gsap.set("#line-wingspan", { drawSVG: 0 });
    // gsap.set("#circle-phalange", { drawSVG: 0 });

    var object;

    function onModelLoaded() {
        object.traverse(function (child) {
            let mat = new THREE.MeshPhongMaterial({
                color: 0x171511,
                specular: 0xd0cbc7,
                shininess: 5,
                flatShading: true,
            });
            // const textureLoader = new THREE.TextureLoader();
            // textureLoader.crossOrigin = "Anonymous";
            // const myTexture = textureLoader.load(
            //     "https://thevedanta.github.io/mannyk-rocket/space%20shuttle%20textures/shuttle.jpg"
            // );
            // let mat = new THREE.MeshPhongMaterial({
            //     map: myTexture,
            // });
            child.material = mat;
        });

        setupAnimation(object);
    }

    var manager = new THREE.LoadingManager(onModelLoaded);
    manager.onProgress = (item, loaded, total) =>
        console.log(item, loaded, total);

    var loader = new THREE.OBJLoader(manager);

    loader.load(
        "https://thevedanta.github.io/mannyk-rocket/rocket.obj",
        function (obj) {
            object = obj;
        }
    );
}

function setupAnimation(model) {
    let scene = new Scene(model);
    let plane = scene.modelGroup;

    gsap.fromTo(
        "canvas",
        { x: "50%", autoAlpha: 0 },
        { duration: 1, x: "0%", autoAlpha: 1 }
    );
    gsap.to(".loading", { autoAlpha: 0 });
    gsap.to(".scroll-cta", { opacity: 1 });
    gsap.set("svg", { autoAlpha: 1 });

    let tau = Math.PI * 2;

    gsap.set(plane.rotation, { y: tau * -0.15 });
    gsap.set(plane.position, { x: 280, y: -32, z: -60 });

    scene.render();

    var sectionDuration = 1;
    gsap.fromTo(
        scene.views[1],
        { height: 1, bottom: 0 },
        {
            height: 0,
            bottom: 1,
            ease: "none",
            scrollTrigger: {
                trigger: ".blueprint",
                scrub: true,
                start: "bottom bottom",
                end: "bottom top",
            },
        }
    );

    gsap.fromTo(
        scene.views[1],
        { height: 0, bottom: 0 },
        {
            height: 1,
            bottom: 0,
            ease: "none",
            scrollTrigger: {
                trigger: ".blueprint",
                scrub: true,
                start: "top bottom",
                end: "top top",
            },
        }
    );

    gsap.to(".ground", {
        y: "30%",
        scrollTrigger: {
            trigger: ".ground-container",
            scrub: true,
            start: "top bottom",
            end: "bottom top",
        },
    });

    gsap.from(".clouds", {
        y: "25%",
        scrollTrigger: {
            trigger: ".ground-container",
            scrub: true,
            start: "top bottom",
            end: "bottom top",
        },
    });

    gsap.to("#line-length", {
        // opacity: 1,
        // drawSVG: 100,
        scrollTrigger: {
            trigger: ".length",
            scrub: true,
            start: "top bottom",
            end: "top top",
        },
    });

    gsap.to("#line-wingspan", {
        // opacity: 1,
        // drawSVG: 100,
        scrollTrigger: {
            trigger: ".wingspan",
            scrub: true,
            start: "top 25%",
            end: "bottom 50%",
        },
    });

    gsap.to("#circle-phalange", {
        // opacity: 1,
        // drawSVG: 100,
        scrollTrigger: {
            trigger: ".phalange",
            scrub: true,
            start: "top 50%",
            end: "bottom 100%",
        },
    });

    gsap.to("#line-length", {
        opacity: 0,
        // drawSVG: 0,
        scrollTrigger: {
            trigger: ".length",
            scrub: true,
            start: "top top",
            end: "bottom top",
        },
    });

    gsap.to("#line-wingspan", {
        opacity: 0,
        // drawSVG: 0,
        scrollTrigger: {
            trigger: ".wingspan",
            scrub: true,
            start: "top top",
            end: "bottom top",
        },
    });

    gsap.to("#circle-phalange", {
        opacity: 0,
        // drawSVG: 0,
        scrollTrigger: {
            trigger: ".phalange",
            scrub: true,
            start: "top top",
            end: "bottom top",
        },
    });

    let tl = new gsap.timeline({
        onUpdate: scene.render,
        scrollTrigger: {
            trigger: ".content",
            scrub: true,
            start: "top top",
            end: "bottom bottom",
        },
        defaults: { duration: sectionDuration, ease: "power2.inOut" },
    });

    let delay = 0;

    tl.to(".scroll-cta", { duration: 0.25, opacity: 0 }, delay);
    tl.to(plane.position, { x: 80, ease: "power1.in" }, delay);

    delay += sectionDuration;

    tl.to(
        plane.rotation,
        { x: tau * 0.25, y: 1, z: -tau * 0.05, ease: "power1.inOut" },
        delay
    );
    tl.to(
        plane.position,
        { x: -80, y: 0, z: -60, ease: "power1.inOut" },
        delay
    );

    delay += sectionDuration;

    tl.to(
        plane.rotation,
        { x: tau * 0.2, y: 0.6, z: tau * 0.05, ease: "power3.inOut" },
        delay
    );
    tl.to(plane.position, { x: 40, y: 0, z: -60, ease: "power2.inOut" }, delay);

    delay += sectionDuration;

    tl.to(
        plane.rotation,
        { x: tau * 0.3, y: 2, z: -tau * 0.1, ease: "power3.inOut" },
        delay
    );
    tl.to(
        plane.position,
        { x: -40, y: 0, z: -30, ease: "power2.inOut" },
        delay
    );

    delay += sectionDuration;

    tl.to(plane.rotation, { x: 0, z: 0, y: 2.2 }, delay);
    tl.to(plane.position, { x: 0, y: -10, z: 50 }, delay);

    delay += sectionDuration;
    delay += sectionDuration;

    tl.to(
        plane.rotation,
        { x: 1.7, y: 3.92, z: 0, ease: "power4.inOut" },
        delay
    );
    tl.to(plane.position, { x: 30, z: 30, ease: "power4.inOut" }, delay);

    delay += sectionDuration;

    // tl.to(
    //     plane.rotation,
    //     { x: tau * 0.25, y: tau * 0.5, z: 0, ease: "power4.inOut" },
    //     delay
    // );
    tl.to(
        plane.rotation,
        { x: 1.7, y: 3.92, z: 0, ease: "power4.inOut" },
        delay
    );
    tl.to(plane.position, { z: 60, x: 30, ease: "power4.inOut" }, delay);

    delay += sectionDuration;

    tl.to(
        plane.rotation,
        { x: tau * 0.35, y: tau * 0.75, z: tau * 0.6, ease: "power4.inOut" },
        delay
    );
    tl.to(plane.position, { z: 60, x: 20, y: 0, ease: "power4.inOut" }, delay);

    delay += sectionDuration;

    tl.to(plane.rotation, { x: 3, y: 3, z: 3, ease: "power1.in" }, delay);
    tl.to(plane.position, { z: -150, x: 0, y: 0, ease: "power1.inOut" }, delay);

    delay += sectionDuration;

    tl.to(
        plane.rotation,
        {
            duration: sectionDuration,
            x: 3.2,
            y: 2,
            z: 3,
            ease: "none",
        },
        delay
    );
    tl.to(
        plane.position,
        { duration: sectionDuration, x: 0, y: 30, z: 320, ease: "power1.in" },
        delay
    );

    tl.to(
        scene.light.position,
        { duration: sectionDuration, x: 0, y: 0, z: 0 },
        delay
    );
}

loadModel();

AOS.init({
    duration: 1000,
    easing: "ease",
});

// LOGO

let logoScene, logoCam, logoRenderer, logoModel;

function initLogo() {
    logoScene = new THREE.Scene();
    logoCam = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    logoRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
    });
    logoRenderer.setSize(window.innerWidth, window.innerHeight + 100);

    document.querySelector(".logo").appendChild(logoRenderer.domElement);

    // const logoGeometry = new THREE.BoxGeometry(2, 2, 2);
    // const logoMaterial = new THREE.MeshBasicMaterial({ color: "#0000ff" });
    // logoCube = new THREE.Mesh(logoGeometry, logoMaterial);

    // logoScene.add(logoCube);

    const loader = new THREE.OBJLoader();
    let mat = new THREE.MeshBasicMaterial({ color: "#13ae4b" });

    loader.load(
        "https://thevedanta.github.io/mannyk-rocket/logo.obj",
        (obj) => {
            obj.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material = mat;
                }
            });

            logoModel = obj;
            logoScene.add(logoModel);
        }
    );

    logoCam.position.z = 5;
}

const makeAnimationFrame = () => {
    requestAnimationFrame(makeAnimationFrame);
    logoModel.scale.set(0.0025, 0.0025, 0.0025);
    logoRenderer.render(logoScene, logoCam);
};

function onWindowResizeLogo() {
    logoCam.aspect = window.innerWidth / window.innerHeight;
    logoCam.updateProjectionMatrix();
    logoRenderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResizeLogo, false);

document.querySelector(".logo").addEventListener("mousemove", (e) => {
    logoModel.rotation.x = (window.innerWidth - e.clientX) * 0.006;
    logoModel.rotation.z = (window.innerHeight - e.clientY) * 0.0006 + 50;
});

initLogo();
makeAnimationFrame();
