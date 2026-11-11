
// "use client";

// import { useEffect, useState } from "react";

// export default function BackgroundVideo() {
//   const [videoUrl, setVideoUrl] = useState("");

//   useEffect(() => {
//     const fetchBackgroundVideo = async () => {
//       try {
//         const response = await fetch(
//           "http://localhost:8090/background-video/active"
//         );

//         const result = await response.json();

//         if (response.ok && result.status) {
//           setVideoUrl(result.data.videoUrl);
//         }
//       } catch (error) {
//         console.error("Background video fetch error:", error);
//       }
//     };

//     fetchBackgroundVideo();
//   }, []);

//   if (!videoUrl) return null;

//   return (
//     <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
//       <video
//         autoPlay
//         muted
//         loop
//         playsInline
//         preload="auto"
//         className="absolute inset-0 w-full h-full object-cover"
//       >
//         <source src={videoUrl} type="video/mp4" />
//       </video>

//       <div className="absolute inset-0 bg-black/30" />
//     </div>
//   );
// }
