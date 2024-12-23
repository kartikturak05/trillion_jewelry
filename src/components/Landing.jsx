import React, { useEffect, useRef,useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const FullSizeModel = ({ src, width = "100%", height = "100%" }) => {
    const containerRef = useRef(null);
    const modelRef = useRef(null);
    const initialPositionRef = useRef(null);
    const isClickedRef = useRef(false);

    useEffect(() => {
        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            physicallyCorrectLights: true,
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.5;
        renderer.outputEncoding = THREE.sRGBEncoding;
        containerRef.current.appendChild(renderer.domElement);

        const camera = new THREE.PerspectiveCamera(
            70,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1,
            5000
        );

        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Increased ambient light intensity
        scene.add(ambientLight);

        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0); // Sky and ground light
        scene.add(hemisphereLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2); // Increased intensity
        directionalLight1.position.set(5, 10, 5);
        scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight2.position.set(-5, -10, 5);
        scene.add(directionalLight2);

        const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight3.position.set(5, -10, -5);
        scene.add(directionalLight3);

        const directionalLight4 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight4.position.set(-5, 10, -5);
        scene.add(directionalLight4);

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let mousePosition = { x: 0, y: 0 };

        const handleMouseMove = (event) => {
            const rect = containerRef.current.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
            mousePosition = {
                x: (event.clientX - rect.left) / containerRef.current.clientWidth - 0.5,
                y: (event.clientY - rect.top) / containerRef.current.clientHeight - 0.5,
            };
        };

        const handleMouseDown = (event) => {
            const rect = containerRef.current.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;

            if (modelRef.current) {
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObject(modelRef.current, true);
                if (intersects.length > 0) {
                    isClickedRef.current = true;
                }
            }
        };

        const handleMouseUp = () => {
            isClickedRef.current = false;
        };

        containerRef.current.addEventListener("mousemove", handleMouseMove);
        containerRef.current.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        const loader = new GLTFLoader();

        loader.load(
            src,
            (gltf) => {
                const model = gltf.scene;
                modelRef.current = model;

                model.traverse((child) => {
                    if (child.isMesh) {
                        const materialName = child.material.name.toLowerCase();

                        // Adjust material properties for better visibility with lights
                        if (materialName.includes("dymond")) {
                            child.material.color.set(0xffffff); // Bright white
                            child.material.emissive.set(0xffffff); // Glow effect
                            child.material.reflectivity = 1.0; // Maximum reflectivity
                            child.material.metalness = 0.9; // High metalness
                            child.material.roughness = 0.1; // Low roughness
                        } else if (materialName.includes("silver")) {
                            child.material.color.set(0xc0c0c0); // Light silver tone
                            child.material.emissive.set(0x000000); // No emissive glow
                            child.material.reflectivity = 0.8; // High reflectivity
                            child.material.metalness = 1.0; // Fully metallic
                            child.material.roughness = 0.2; // Slight roughness
                            child.material.shininess = 30; // Added shine
                        }
                    }
                });

                scene.add(model);

                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());

                model.position.sub(center);

                const maxDimension = Math.max(size.x, size.y, size.z);
                const scale = Math.min(
                    (containerRef.current.clientWidth * 0.6) / maxDimension,
                    (containerRef.current.clientHeight * 0.6) / maxDimension
                );
                model.scale.setScalar(scale);

                initialPositionRef.current = model.position.clone();

                const distance = maxDimension * 1.8;
                camera.position.set(0, distance * 0.2, distance);
                camera.lookAt(0, 0, 0);
            },
            undefined,
            (error) => {
                console.error("Error loading model:", error);
            }
        );

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enableZoom = true;

        const animate = () => {
            requestAnimationFrame(animate);

            if (modelRef.current) {
                if (isClickedRef.current) {
                    const targetX = initialPositionRef.current.x + mousePosition.x * 2;
                    const targetY = initialPositionRef.current.y - mousePosition.y * 2;

                    modelRef.current.position.x += (targetX - modelRef.current.position.x) * 0.1;
                    modelRef.current.position.y += (targetY - modelRef.current.position.y) * 0.1;

                    modelRef.current.rotation.x += (mousePosition.y * 0.2 - modelRef.current.rotation.x) * 0.1;
                    modelRef.current.rotation.y += (mousePosition.x * 0.2 - modelRef.current.rotation.y) * 0.1;
                } else {
                    modelRef.current.position.lerp(initialPositionRef.current, 0.1);
                    modelRef.current.rotation.y += 0.003;
                    modelRef.current.rotation.x *= 0.95;
                }
            }

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                const height = containerRef.current.clientHeight;

                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            containerRef.current?.removeEventListener("mousemove", handleMouseMove);
            containerRef.current?.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            renderer.dispose();
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, [src]);

    return (
        <div
            ref={containerRef}
            style={{
                width,
                height,
                overflow: "hidden",
                position: "relative",
                backgroundColor: "transparent",
            }}
        ></div>
    );
};






function Landing() {
  
    const [screenSize, setScreenSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });


    useEffect(() => {
        const handleResize = () => {
            setScreenSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleDemoClick = () => {
        // navigate('/BookDemo');  // Navigate to the 3D Model page
        window.open("https://calendly.com/connexindia", "_blank");
        // window.open("https://calendly.com/kartik-turak-cs-ghrce/myevent", "_blank");
      };


    return (
        <div
            className=" h-auto  md:h-full lg:h-full w-full cursor-grab bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: "url('/d3.png')",
            }}
        >
            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between items-center px-4 pt-20 sm:px-6 py-10 sm:py-20">
                {/* Left Section */}
                <div className="w-full sm:flex-1 max-w-lg mx-auto px-4 sm:px-5 text-center sm:text-left">
                    <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight sm:leading-none mt-5">
                        VIRTUAL <br />
                        TRY-ON
                    </h1>
                    <p className="text-white text-base sm:text-lg font-semibold leading-snug mt-4 sm:mt-2 mb-6 sm:mb-8">
                        Powerful tools for creating and distributing lifelike 3D content and AR experiences. Elevate e-commerce, digital marketing, and more to boost engagement and drive sales.
                    </p>
                    <div className="flex justify-center w-full px-4">
                        <div className="flex items-center bg-[#384241] rounded-full shadow-lg w-fit max-w-sm sm:max-w-lg p-2">
                            <div onClick={handleDemoClick} className="bg-white text-gray-700 rounded-full px-10 py-4 sm:px-20 sm:py-2 outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-lg text-center font-bold">
                                BOOK A DEMO
                            </div>
                        </div>
                    </div>



                </div>
                {/* Right Section */}
                <div
                    className="w-full sm:w-1/2 flex justify-center items-center mt-20 sm:mt-0"
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    {/* 3D Model */}
                    <FullSizeModel
                        src="/Untitled.glb"
                        width={screenSize.width < 768 ? '200px' : '600px'} // Adjusted for smaller devices
                        height={screenSize.width < 768 ? '200px' : '400px'}
                    />
                </div>

                {/* Materials Section */}
                <div className="absolute right-2 lg:right-6 md:right-4 bottom-0.5 sm:bottom-auto sm:top-1/4 flex flex-col items-center bg-gray-200 rounded-full p-3 sm:p-4 shadow-lg">
                    {/* Vertical Text */}
                    <div
                        className="text-gray-800 font-bold text-xs sm:text-sm mb-2"
                        style={{
                            writingMode: 'vertical-rl',
                            transform: 'rotate(0deg)', // Text starts from the top flowing downward
                            letterSpacing: '1px',
                        }}
                    >
                        MATERIALS
                    </div>

                    {/* Circles */}
                    <div className="flex flex-col items-center space-y-1 sm:space-y-1">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-400"></div>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-orange-300"></div>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#A07850]"></div>
                    </div>
                </div>
            </div>
        </div>




    );
}

export default Landing;
