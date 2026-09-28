// RetinaScan AI - Clinical Patient Profiles & Institutional Data

export const PATIENTS = [
  {
    id: "PT-84920",
    name: "Eleanor Vance",
    age: 62,
    gender: "Female",
    dob: "1964-03-14",
    phone: "(555) 234-8901",
    email: "e.vance@example.com",
    mrn: "MRN-84920-A",
    pcp: "Dr. Gregory House, Internal Medicine",
    clinic: "St. Jude Comprehensive Diabetes Center",
    encounterDate: "2026-09-04",
    photoUrl: "assets/patient_eleanor_vance.jpg",
    diabetesType: "Type 2 Diabetes Mellitus",
    durationYears: 14,
    hba1c: 9.4,
    bpSystolic: 142,
    bpDiastolic: 88,
    insulinTherapy: true,
    visualAcuityOD: "20/40",
    visualAcuityOS: "20/30",
    dilationStatus: "Non-Mydriatic (45° Field)",
    deviceCamera: "Topcon NW400 Robotic Fundus Camera",
    status: "READY_FOR_DIAGNOSIS",
    statusLabel: "AI Staged - Needs Referral",
    statusColor: "amber",
    
    // Scans
    scans: {
      OD: {
        eye: "OD",
        label: "Right Eye (OD)",
        imageUrl: "assets/fundus_od_moderate_npdr.jpg",
        qcScanUrl: "assets/fundus_qc_scan.jpg",
        captureTime: "11:42 AM",
        qcMetrics: {
          sharpness: 96.4,
          illumination: 94.8,
          centering: "Macula-Centered (ETDRS Field 2)",
          centeringPass: true,
          mediaOpacity: 4.2, // minimal cataract
          gradeability: 96.4,
          status: "PASS"
        },
        diagnosis: {
          icdrStage: "Moderate NPDR",
          icdrLevel: 2,
          icdrDescription: "Moderate Non-Proliferative Diabetic Retinopathy",
          confidence: 94.2,
          latencyMs: 382,
          dmeRisk: 88.7, // Diabetic Macular Edema risk
          dmeStatus: "High Risk (CSME Indicated)",
          urgency: "Semi-Urgent Specialist Referral",
          timeframe: "2 - 4 Weeks",
          biomarkers: [
            {
              id: "BM-01",
              type: "microaneurysm",
              name: "Microaneurysms",
              count: 14,
              severity: "Moderate",
              color: "#EF4444",
              confidence: 96.8,
              locations: [
                { x: 340, y: 280, r: 8, label: "MA-1" },
                { x: 380, y: 310, r: 6, label: "MA-2" },
                { x: 420, y: 260, r: 7, label: "MA-3" },
                { x: 310, y: 390, r: 9, label: "MA-4" },
                { x: 490, y: 340, r: 6, label: "MA-5" }
              ],
              description: "Focal capillary outpouchings located primarily in the parafoveal temporal quadrant."
            },
            {
              id: "BM-02",
              type: "hard_exudate",
              name: "Hard Exudates",
              count: 8,
              severity: "Significant",
              color: "#F59E0B",
              confidence: 93.4,
              locations: [
                { x: 460, y: 290, r: 14, label: "HE-1 (Circinate)" },
                { x: 480, y: 310, r: 10, label: "HE-2" },
                { x: 440, y: 320, r: 12, label: "HE-3" }
              ],
              description: "Lipid and lipoprotein precipitates forming a partial circinate ring within 1 disc diameter of fovea."
            },
            {
              id: "BM-03",
              type: "hemorrhage",
              name: "Intraretinal Hemorrhages",
              count: 6,
              severity: "Moderate",
              color: "#DC2626",
              confidence: 95.1,
              locations: [
                { x: 290, y: 320, r: 12, label: "H-1 (Dot/Blot)" },
                { x: 530, y: 240, r: 16, label: "H-2 (Flame)" }
              ],
              description: "Dot and blot hemorrhages in inner nuclear layers without definite venous beading."
            },
            {
              id: "BM-04",
              type: "cotton_wool",
              name: "Cotton Wool Spots",
              count: 2,
              severity: "Mild",
              color: "#E2E8F0",
              confidence: 89.6,
              locations: [
                { x: 360, y: 210, r: 15, label: "CWS-1" }
              ],
              description: "Nerve fiber layer micro-infarctions observed superior to optic disc margin."
            }
          ]
        }
      },
      OS: {
        eye: "OS",
        label: "Left Eye (OS)",
        imageUrl: "assets/fundus_qc_scan.jpg",
        qcScanUrl: "assets/fundus_qc_scan.jpg",
        captureTime: "11:44 AM",
        qcMetrics: {
          sharpness: 94.1,
          illumination: 92.5,
          centering: "Macula-Centered (ETDRS Field 2)",
          centeringPass: true,
          mediaOpacity: 3.8,
          gradeability: 94.1,
          status: "PASS"
        },
        diagnosis: {
          icdrStage: "Mild NPDR",
          icdrLevel: 1,
          icdrDescription: "Mild Non-Proliferative Diabetic Retinopathy",
          confidence: 96.1,
          latencyMs: 345,
          dmeRisk: 24.3,
          dmeStatus: "Low Risk",
          urgency: "Routine Retinal Surveillance",
          timeframe: "6 - 12 Months",
          biomarkers: [
            {
              id: "BM-OS-01",
              type: "microaneurysm",
              name: "Microaneurysms",
              count: 3,
              severity: "Mild",
              color: "#EF4444",
              confidence: 97.2,
              locations: [
                { x: 350, y: 300, r: 6, label: "MA-1" },
                { x: 410, y: 330, r: 7, label: "MA-2" }
              ],
              description: "Isolated microaneurysms only; no exudation or macular thickening detected."
            }
          ]
        }
      }
    }
  },
  {
    id: "PT-91042",
    name: "Robert Chen",
    age: 54,
    gender: "Male",
    dob: "1972-07-21",
    phone: "(555) 345-6789",
    email: "r.chen@example.com",
    mrn: "MRN-91042-C",
    pcp: "Dr. Lisa Cuddy, Endocrinology",
    clinic: "Bayview Ambulatory Health Pavilion",
    encounterDate: "2026-09-04",
    photoUrl: "assets/patient_eleanor_vance.jpg",
    diabetesType: "Type 2 Diabetes Mellitus",
    durationYears: 6,
    hba1c: 7.6,
    bpSystolic: 128,
    bpDiastolic: 82,
    insulinTherapy: false,
    visualAcuityOD: "20/20",
    visualAcuityOS: "20/25",
    dilationStatus: "Non-Mydriatic (45° Field)",
    deviceCamera: "Canon CR-2 AF Retinal Camera",
    status: "READY_FOR_DIAGNOSIS",
    statusLabel: "AI Staged - Mild",
    statusColor: "blue",
    scans: {
      OD: {
        eye: "OD",
        label: "Right Eye (OD)",
        imageUrl: "assets/fundus_qc_scan.jpg",
        qcScanUrl: "assets/fundus_qc_scan.jpg",
        captureTime: "10:15 AM",
        qcMetrics: {
          sharpness: 98.2,
          illumination: 96.1,
          centering: "Macula-Centered",
          centeringPass: true,
          mediaOpacity: 1.5,
          gradeability: 98.2,
          status: "PASS"
        },
        diagnosis: {
          icdrStage: "Mild NPDR",
          icdrLevel: 1,
          icdrDescription: "Mild Non-Proliferative Diabetic Retinopathy",
          confidence: 97.4,
          latencyMs: 312,
          dmeRisk: 14.2,
          dmeStatus: "Low Risk",
          urgency: "Annual Retinal Surveillance",
          timeframe: "12 Months",
          biomarkers: [
            {
              id: "BM-RC-01",
              type: "microaneurysm",
              name: "Microaneurysms",
              count: 4,
              severity: "Mild",
              color: "#EF4444",
              confidence: 96.5,
              locations: [
                { x: 380, y: 290, r: 7, label: "MA-1" },
                { x: 320, y: 340, r: 6, label: "MA-2" }
              ],
              description: "Few microaneurysms in temporal mid-periphery."
            }
          ]
        }
      },
      OS: {
        eye: "OS",
        label: "Left Eye (OS)",
        imageUrl: "assets/fundus_qc_scan.jpg",
        qcScanUrl: "assets/fundus_qc_scan.jpg",
        captureTime: "10:18 AM",
        qcMetrics: {
          sharpness: 97.5,
          illumination: 95.0,
          centering: "Macula-Centered",
          centeringPass: true,
          mediaOpacity: 1.8,
          gradeability: 97.5,
          status: "PASS"
        },
        diagnosis: {
          icdrStage: "No Apparent DR",
          icdrLevel: 0,
          icdrDescription: "No Diabetic Retinopathy Detected",
          confidence: 98.9,
          latencyMs: 298,
          dmeRisk: 3.1,
          dmeStatus: "Minimal / Negative",
          urgency: "Annual Retinal Exam",
          timeframe: "12 Months",
          biomarkers: []
        }
      }
    }
  },
  {
    id: "PT-77319",
    name: "Maria Santos",
    age: 68,
    gender: "Female",
    dob: "1958-11-09",
    phone: "(555) 456-7890",
    email: "m.santos@example.com",
    mrn: "MRN-77319-M",
    pcp: "Dr. James Wilson, Primary Care",
    clinic: "Metropolitan Endocrine Clinic",
    encounterDate: "2026-09-04",
    photoUrl: "assets/patient_eleanor_vance.jpg",
    diabetesType: "Type 1 Diabetes Mellitus",
    durationYears: 22,
    hba1c: 10.8,
    bpSystolic: 158,
    bpDiastolic: 94,
    insulinTherapy: true,
    visualAcuityOD: "20/80",
    visualAcuityOS: "20/70",
    dilationStatus: "Pharmacologically Dilated (Mydriatic)",
    deviceCamera: "Topcon NW400 Robotic Fundus Camera",
    status: "READY_FOR_DIAGNOSIS",
    statusLabel: "Critical Urgent (PDR)",
    statusColor: "red",
    scans: {
      OD: {
        eye: "OD",
        label: "Right Eye (OD)",
        imageUrl: "assets/fundus_od_moderate_npdr.jpg",
        qcScanUrl: "assets/fundus_qc_scan.jpg",
        captureTime: "09:30 AM",
        qcMetrics: {
          sharpness: 92.0,
          illumination: 91.2,
          centering: "Disc & Macula Centered",
          centeringPass: true,
          mediaOpacity: 7.8,
          gradeability: 92.0,
          status: "PASS"
        },
        diagnosis: {
          icdrStage: "Proliferative DR (PDR)",
          icdrLevel: 4,
          icdrDescription: "High-Risk Proliferative Diabetic Retinopathy with Active NVD",
          confidence: 98.4,
          latencyMs: 412,
          dmeRisk: 96.2,
          dmeStatus: "Severe CSME Present",
          urgency: "EMERGENCY RETINAL SPECIALIST REFERRAL",
          timeframe: "Within 24 - 48 Hours",
          biomarkers: [
            {
              id: "BM-MS-01",
              type: "neovascularization",
              name: "Neovascularization of Disc (NVD)",
              count: 3,
              severity: "High Risk",
              color: "#991B1B",
              confidence: 98.6,
              locations: [
                { x: 310, y: 300, r: 24, label: "NVD-1" },
                { x: 440, y: 220, r: 18, label: "NVE-1" }
              ],
              description: "Extensive frond-like neovascular vessels arborizing over optic nerve head."
            },
            {
              id: "BM-MS-02",
              type: "hard_exudate",
              name: "Macular Exudates & Edema",
              count: 12,
              severity: "Severe",
              color: "#F59E0B",
              confidence: 96.0,
              locations: [
                { x: 450, y: 300, r: 20, label: "ME-1" }
              ],
              description: "Confluent hard exudates encroaching directly onto central foveal avascular zone."
            }
          ]
        }
      }
    }
  },
  {
    id: "PT-10492",
    name: "David Kim",
    age: 48,
    gender: "Male",
    dob: "1978-05-18",
    phone: "(555) 789-0123",
    email: "d.kim@example.com",
    mrn: "MRN-10492-D",
    pcp: "Dr. Allison Cameron, Internal Medicine",
    clinic: "Princeton Wellness Clinic",
    encounterDate: "2026-09-04",
    photoUrl: "assets/patient_eleanor_vance.jpg",
    diabetesType: "Type 2 Diabetes Mellitus",
    durationYears: 2,
    hba1c: 6.4,
    bpSystolic: 120,
    bpDiastolic: 78,
    insulinTherapy: false,
    visualAcuityOD: "20/20",
    visualAcuityOS: "20/20",
    dilationStatus: "Non-Mydriatic",
    deviceCamera: "Volk VisiScopic Field Adapter",
    status: "COMPLETED",
    statusLabel: "Normal - Annual Recall",
    statusColor: "emerald",
    scans: {
      OD: {
        eye: "OD",
        label: "Right Eye (OD)",
        imageUrl: "assets/fundus_qc_scan.jpg",
        qcScanUrl: "assets/fundus_qc_scan.jpg",
        captureTime: "08:45 AM",
        qcMetrics: {
          sharpness: 99.1,
          illumination: 97.4,
          centering: "Macula-Centered",
          centeringPass: true,
          mediaOpacity: 0.8,
          gradeability: 99.1,
          status: "PASS"
        },
        diagnosis: {
          icdrStage: "No Apparent DR",
          icdrLevel: 0,
          icdrDescription: "Normal Retinal Exam - No Diabetic Retinopathy",
          confidence: 99.2,
          latencyMs: 276,
          dmeRisk: 1.8,
          dmeStatus: "Negative",
          urgency: "Routine Annual Screening",
          timeframe: "12 Months",
          biomarkers: []
        }
      }
    }
  }
];

export const SPECIALISTS = [
  {
    id: "SPEC-01",
    name: "Dr. Sarah Jenkins, MD, FACS",
    title: "Vitreoretinal Specialist & Surgeon",
    facility: "Metro VitreoRetinal Institute",
    address: "450 Medical Center Blvd, Suite 320, Boston MA",
    distance: "1.2 miles",
    photoUrl: "assets/dr_sarah_jenkins.jpg",
    phone: "(555) 782-9011",
    fax: "(555) 782-9012",
    nextAvailable: "Tomorrow at 9:30 AM",
    insurance: ["Medicare Part B", "Blue Cross Blue Shield", "Aetna PPO", "Harvard Pilgrim", "MassHealth"],
    rating: 4.9,
    reviewsCount: 142,
    acceptingUrgent: true,
    subspecialties: ["Diabetic Retinopathy", "Macular Degeneration", "Anti-VEGF Therapy", "Vitrectomy"]
  },
  {
    id: "SPEC-02",
    name: "Dr. Marcus Vance, MD",
    title: "Chief of Ophthalmology & Retina Services",
    facility: "University Retina & Ophthalmic Center",
    address: "800 Harrison Ave, 6th Floor, Boston MA",
    distance: "3.4 miles",
    photoUrl: "assets/dr_marcus_vance.jpg",
    phone: "(555) 891-2300",
    fax: "(555) 891-2301",
    nextAvailable: "Friday at 2:00 PM",
    insurance: ["Medicare Part B", "Tufts Health Plan", "UnitedHealthcare", "Cigna", "Aetna"],
    rating: 4.8,
    reviewsCount: 98,
    acceptingUrgent: true,
    subspecialties: ["Complex Diabetic Retinal Surgery", "Proliferative DR", "Laser Photocoagulation"]
  },
  {
    id: "SPEC-03",
    name: "Dr. Arun Patel, MD",
    title: "Medical Retina Specialist",
    facility: "Associated Retina Consultants",
    address: "125 Cambridgepark Drive, Suite 100, Cambridge MA",
    distance: "4.8 miles",
    photoUrl: "assets/dr_arun_patel.jpg",
    phone: "(555) 912-3450",
    fax: "(555) 912-3451",
    nextAvailable: "Next Monday at 11:00 AM",
    insurance: ["Medicare", "Blue Cross Blue Shield", "Harvard Pilgrim", "Point32Health"],
    rating: 4.9,
    reviewsCount: 184,
    acceptingUrgent: false,
    subspecialties: ["Diabetic Macular Edema (DME)", "Microvascular Retinal Disease", "OCT Angiography"]
  },
  {
    id: "SPEC-04",
    name: "Dr. Elena Rostova, MD, PhD",
    title: "Director of Clinical Retinal Research",
    facility: "Eastside Laser & Retinal Center",
    address: "210 Riverway, Suite 400, Boston MA",
    distance: "6.1 miles",
    photoUrl: "assets/dr_elena_rostova.jpg",
    phone: "(555) 432-1090",
    fax: "(555) 432-1091",
    nextAvailable: "Oct 12 at 10:00 AM",
    insurance: ["Medicare Part B", "Blue Cross", "Aetna", "Humana"],
    rating: 4.7,
    reviewsCount: 76,
    acceptingUrgent: false,
    subspecialties: ["Novel Anti-VEGF Therapeutics", "Diabetic Tele-Ophthalmology", "Translational Retina"]
  }
];
