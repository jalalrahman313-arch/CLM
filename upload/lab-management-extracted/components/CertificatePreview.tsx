"use client";

import { useRef, useState } from "react";
import { X, FileText, Image as ImageIcon, Loader2, GraduationCap } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CertificatePreviewProps {
  student: {
    name: string;
    className: string;
    year: string;
    courses: string[];
    rollNo: string;
  };
  onClose: () => void;
}

export default function CertificatePreview({ student, onClose }: CertificatePreviewProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportAsPNG = async () => {
    if (!certificateRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Certificate_${student.name.replace(/\s+/g, '_')}.png`;
      link.click();
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!certificateRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`Certificate_${student.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl flex justify-between items-center mb-6 px-4">
        <div className="flex flex-col">
          <h3 className="text-white text-xl font-bold flex items-center gap-2">
            <GraduationCap className="text-accent" />
            Certificate Preview
          </h3>
          <p className="text-white/40 text-xs">Professional Academic Credential</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportAsPNG}
            disabled={isExporting}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl transition-all border border-white/10 text-sm font-semibold disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            Export PNG
          </button>
          <button 
            onClick={exportAsPDF}
            disabled={isExporting}
            className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white px-5 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] text-sm font-semibold disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Export PDF
          </button>
          <button 
            onClick={onClose}
            className="p-2.5 bg-white/5 hover:bg-white/20 text-white/60 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="w-full max-w-4xl aspect-[1.414/1] bg-white shadow-2xl relative overflow-hidden rounded-sm select-none" ref={certificateRef} style={{ width: '100%' }}>
        {/* Intricate Border Design */}
        <div className="absolute inset-0 border-[24px] border-[#10b981]/10 m-4 pointer-events-none"></div>
        <div className="absolute inset-0 border-[2px] border-[#c5a059]/40 m-[44px] pointer-events-none"></div>
        <div className="absolute inset-0 border-[1px] border-[#c5a059]/20 m-[52px] pointer-events-none"></div>
        
        {/* Elaborate Corners */}
        {[0, 90, 180, 270].map((rot) => (
          <div key={rot} className="absolute w-32 h-32 m-6 pointer-events-none" style={{ top: rot < 180 ? 0 : 'auto', bottom: rot >= 180 ? 0 : 'auto', left: rot % 270 === 0 ? 0 : 'auto', right: rot === 90 || rot === 180 ? 0 : 'auto', transform: `rotate(${rot}deg)` }}>
            <div className="absolute top-0 left-0 w-16 h-[2px] bg-[#c5a059]"></div>
            <div className="absolute top-0 left-0 w-[2px] h-16 bg-[#c5a059]"></div>
            <div className="absolute top-4 left-4 w-12 h-[1px] bg-[#c5a059]/50"></div>
            <div className="absolute top-4 left-4 w-[1px] h-12 bg-[#c5a059]/50"></div>
          </div>
        ))}

        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/parchment.png')]"></div>

        {/* Diagonal Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none overflow-hidden select-none rotate-[-35deg]">
          <span className="text-[12rem] font-bold tracking-tighter whitespace-nowrap text-[#10b981]">JAMIA ASHRAFIA</span>
        </div>

        {/* Certificate Content Container */}
        <div className="relative z-10 h-full flex flex-col items-center justify-between text-center px-24 py-20 font-serif">
          
          {/* Header with Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-[#10b981]/10 rounded-full flex items-center justify-center border-2 border-[#10b981]/30">
              <GraduationCap className="w-8 h-8 text-[#10b981]" />
            </div>
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-bold tracking-[0.2em] text-[#1a3a3a] mb-1">JAMIA ASHRAFIA</h2>
              <div className="w-full flex items-center justify-center gap-4">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#c5a059]/50"></div>
                <span className="text-[10px] font-sans tracking-[0.4em] text-[#c5a059] uppercase font-bold">Islamic University</span>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#c5a059]/50"></div>
              </div>
            </div>
          </div>

          {/* Main Title Section */}
          <div className="flex flex-col items-center">
            <h1 className="text-6xl font-extrabold text-[#1a3a3a] tracking-tight mb-2">CERTIFICATE</h1>
            <h2 className="text-lg font-medium text-[#c5a059] tracking-[0.4em] italic uppercase">of academic completion</h2>
          </div>

          {/* Recipient Section */}
          <div className="flex flex-col items-center w-full max-w-xl">
            <p className="text-base text-slate-500 mb-6 italic tracking-wide">This formal credential is proudly presented to</p>
            <div className="mb-4 relative w-full flex flex-col items-center">
              <span className="text-5xl font-bold text-[#10b981] font-sans pb-3 px-12 tracking-wide uppercase">{student.name}</span>
              <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#c5a059]/60 to-transparent"></div>
            </div>
            <p className="text-xs text-slate-400 font-sans tracking-widest uppercase">Student ID: {student.rollNo}</p>
          </div>

          {/* Achievement Description */}
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl px-6">
            In recognition of successful fulfillment of all prescribed academic requirements and demonstrating exceptional proficiency within the 
            <span className="font-bold text-slate-900 mx-1.5 uppercase font-sans tracking-wide">{student.className}</span> 
            academic program during the session of 
            <span className="font-bold text-slate-900 mx-1.5 font-sans">{student.year}</span>.
          </p>

          {/* Completed Modules */}
          <div className="flex flex-wrap justify-center gap-2 max-w-xl">
            {student.courses.length > 0 ? (
              student.courses.slice(0, 8).map((course, idx) => (
                <span key={idx} className="px-3 py-1 bg-[#10b981]/5 border border-[#10b981]/10 rounded shadow-sm text-slate-700 text-[9px] font-bold uppercase tracking-wider">
                  {course}
                </span>
              ))
            ) : (
              <span className="italic text-slate-400 text-xs">Full Computer Science & Information Technology Curriculum</span>
            )}
            {student.courses.length > 8 && (
              <span className="text-[9px] text-slate-400 self-center font-bold">+{student.courses.length - 8} MORE</span>
            )}
          </div>

          {/* Footer - Signatures & Seal */}
          <div className="w-full flex justify-between items-end mt-4">
            {/* Signature 1 */}
            <div className="flex flex-col items-center w-40">
              <div className="w-full border-t border-slate-300 pt-2 mb-1">
                <div className="h-8 flex items-center justify-center italic text-[#c5a059]/40 font-serif text-sm">Signature</div>
              </div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">Administrator</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-sans">Board of Directors</span>
            </div>

            {/* Official Seal - Centered */}
            <div className="relative mb-[-10px]">
              <div className="w-28 h-28 rounded-full border-[1px] border-[#c19a4e]/30 p-1 flex items-center justify-center relative bg-[#c19a4e]/5">
                <div className="w-full h-full rounded-full border-[2px] border-[#c19a4e]/60 flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Seal Rings */}
                  <div className="absolute inset-0 border border-dashed border-[#c19a4e]/40 p-2 rounded-full"></div>
                  
                  <div className="text-[#c19a4e] text-center transform -rotate-12 select-none">
                    <span className="text-[6px] font-bold block uppercase tracking-tighter">JAMIA ASHRAFIA</span>
                    <span className="text-[12px] font-extrabold block uppercase tracking-tight leading-none">OFFICIAL</span>
                    <span className="text-[8px] font-bold block uppercase tracking-widest mt-1">SEAL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature 2 */}
            <div className="flex flex-col items-center w-40">
              <div className="w-full border-t border-slate-300 pt-2 mb-1">
                <div className="h-8 flex items-center justify-center italic text-[#c5a059]/40 font-serif text-sm">Signature</div>
              </div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">Department Head</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-sans">IT & Computer Lab</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
