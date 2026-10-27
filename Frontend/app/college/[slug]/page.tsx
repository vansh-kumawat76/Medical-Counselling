"use client";

import api from "../../../src/lib/axios";
import { useParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function CollegeDetails() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    const fetchData = async () => {
      const response = await api.get(
        `/college/Get-One-Colleges/${slug}`
      );
      console.log(response);
    };

    fetchData();
  }, [slug]);

  return <div>slug page</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading college details...</div>}>
      <CollegeDetails />
    </Suspense>
  );
}