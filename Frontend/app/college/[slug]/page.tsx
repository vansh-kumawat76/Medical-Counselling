"use client"
import api from "../../../src/lib/axios";
import { useParams } from "next/navigation"
import { useEffect } from "react";


const page = () => {
    const {slug} = useParams();
    useEffect(()=>{
        const fetchData = async()=>{
const response = await api.get(`/college/Get-One-Colleges/${slug}`)
console.log(response);
        }
        
    })
  return (
    <div>
        slug page
    </div>
  )
}

export default page