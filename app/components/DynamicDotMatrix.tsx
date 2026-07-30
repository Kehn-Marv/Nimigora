"use client";

import dynamic from "next/dynamic";

const DynamicDotMatrix = dynamic(() => import("./DotMatrix"), { ssr: false });

export default DynamicDotMatrix;
