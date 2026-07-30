"use client";

import dynamic from "next/dynamic";

const DynamicGlobe = dynamic(() => import("./Globe"), { ssr: false });

export default DynamicGlobe;
