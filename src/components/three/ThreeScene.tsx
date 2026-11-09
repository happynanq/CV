"use client"
import { useRouter } from "next/navigation"
import { createElement, useEffect, useRef } from "react"
import * as THREE from "three"
import { FontLoader, GLTFLoader, OrbitControls, TextGeometry } from "three/examples/jsm/Addons.js"

export function ThreeScene(){ 
  const router = useRouter()
  const hostRef = useRef<HTMLDivElement | null>(null)

  const draggedRef = useRef<boolean>(false)
  const isRedirectRef = useRef<boolean>(false)

  const startPositionRef = useRef<number[]>([0, 0])

  useEffect(()=>{
    const host = hostRef.current
    if(!host) return;

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.2, 100)
    camera.position.set(0, 20, 10); 
    scene.add(camera)


    const renderer = new THREE.WebGLRenderer({
      antialias:true, 
      alpha:true
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(host.clientWidth, host.clientWidth)
    host.appendChild(renderer.domElement)


    const mixers: THREE.AnimationMixer[] = []

    const timer = new THREE.Timer() 

    timer.connect(document)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true;

    const matcapMaterial = new THREE.MeshMatcapMaterial()
    let matcapTexture: THREE.Texture | null = null 
    let dispised = false ;

    scene.add(new THREE.AmbientLight(0xffffff, 2))
    const keyLight = new THREE.DirectionalLight(0xffffff, 3); 
    keyLight.position.set(3, 5, 4)
    scene.add(keyLight)
    


    new THREE.TextureLoader().load("/matcaps/gold.png", (texture)=>{

      texture.colorSpace = THREE.SRGBColorSpace;
      matcapTexture = texture
      matcapMaterial.matcap = texture 
      matcapMaterial.needsUpdate = true
    })

    new FontLoader().load(
      "fonts/helvetiker_regular.typeface.json", 
      (font)=>{
        const textGeometry = new TextGeometry("Kirill\nAleksandrov", {
          font, size:0.5, depth:0.2, curveSegments:12, 
          bevelEnabled:true, 
          bevelThickness:0.03, 
          bevelSize:0.02, 
          bevelOffset:0, 
          bevelSegments:5
        })

        textGeometry.center()
        scene.add(new THREE.Mesh(textGeometry, matcapMaterial))
      }
    )

    new GLTFLoader().load("/models/spinning-gold-coin.glb" , 
      (gltf)=>{
        for(let i = 0; i < 200; i++){ 
          const coin = gltf.scene.clone(true); 
          coin.position.set(
            (Math.random() - 0.5) * 20 ,
            (Math.random() - 0.5) * 10 ,
            (Math.random() - 0.5) * 10 ,
          )

          coin.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI,
          )
          coin.scale.setScalar(Math.random())
          scene.add(coin)

          const mixer = new THREE.AnimationMixer(coin)
          gltf.animations.forEach(clip=> mixer.clipAction(clip).play())
          mixers.push(mixer)
          
        }
    })

    


    const resizeObserver = new ResizeObserver(()=>{
      const {height, width} = host.getBoundingClientRect()
      if(!width || !height){ 
        return 
      }
      camera.aspect = width / height; 
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    })
    resizeObserver.observe(host); 

    let animationFrame = 0;
    const render = (timestamp: number) => {
      timer.update(timestamp);
      const delta = timer.getDelta();
      mixers.forEach((mixer) => mixer.update(delta));
      controls.update();
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(render);
    };

    animationFrame = window.requestAnimationFrame(render)
    
  }, [])

  


  return <div className="three-scene" id="three" ref={hostRef} 
  onPointerDown={(e)=>{
    startPositionRef.current[0] = e.clientX
    startPositionRef.current[1] = e.clientY


    draggedRef.current = true

  }}
  
  onPointerMove={(e)=>{
    if(!draggedRef.current) return
    const startX = startPositionRef.current[0]
    const startY = startPositionRef.current[1]

    const dx = startX - e.clientX < 0 ? -(startX - e.clientX):startX - e.clientX
    const dy = startY - e.clientY < 0 ? -(startY - e.clientY):startY - e.clientY
    
    if(dx+dy > 4){
      isRedirectRef.current = true
    }


  }}
  
  onPointerUp={()=>{

    draggedRef.current = false
    if(!isRedirectRef.current){ 
      router.push("/slot")
    }

    isRedirectRef.current = false



  }}
  
  
  
  ></div>
}