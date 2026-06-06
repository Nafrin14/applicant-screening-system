import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Papa from "papaparse";

function ApplicantList() {

const navigate = useNavigate();

const [applicants, setApplicants] = useState([]);

const [search, setSearch] =useState("");

const [filterStatus, setFilterStatus] =useState("All");
useEffect(() => {
fetchApplicants();
  },
   []);


const fetchApplicants = async () => {

const { data, error } =
      await supabase
      .from("applicants")
      .select("*");

  if (error) {
      console.log(error);
    } else
       {
      setApplicants(data || []);
    }
  };


const handleCSVUpload = (event) => {

const file = event.target.files[0];

    if (!file) return;
    Papa.parse(file,
       {
      header: true,
      complete: async (results) => 
        {

const formattedData =
   results.data
    .filter(
     (row) =>
    row.name &&
    row.email
            )

     .map((row) => ({
      name:row.name || "",

      email:row.email || "",

      phone:row.phone || "",

      skills:row.skills || "",

      score:row.score || 0,

      status:row.status || "Pending",

      resume_url:row.resume_url || ""

            }));

      if   ( formattedData.length > 0) 
        {
             await supabase
            .from("applicants")
            .insert(formattedData);

            fetchApplicants();
        }
      }
    });
  };

  const updateStatus = async (
    id,
    newStatus
  ) =>
     {

    await supabase
    .from("applicants")
    .update({
     status: newStatus
      })
      .eq("id", id);
     fetchApplicants();
     };

  const deleteApplicant = async (id) => {

  await supabase
  .from("applicants")
  .delete()
  .eq("id", id);

  fetchApplicants();
  };

  const filteredApplicants =
  applicants.filter((applicant) => {

  const matchesSearch =
  (applicant.name || "")
  .toLowerCase()
  .includes(search.toLowerCase());

  const matchesStatus =
   filterStatus === "All"
   ? true
   : applicant.status === filterStatus;

   return (
        matchesSearch &&
        matchesStatus
      );
      });

  return (

   <div
        style={{
        padding: "30px",
        backgroundColor: "#f4f6f9",
        minHeight: "100vh"
      }}
    >

      <h1
        style={{
          marginBottom: "20px",
          color: "#2563eb"
        }}
      >
        Candidates
      </h1>

    <div
          style={{
          display: "flex",
          gap: "15px",
          marginBottom: "30px",
          flexWrap: "wrap"
        }}
      >

    <input
          type="text"
          placeholder="Search candidate..."
          value={search}
          onChange={(e) =>
          setSearch(e.target.value)
          }

            style={{
            padding: "12px",
            width: "300px",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        />

    <select
           value={filterStatus}
           onChange={(e) =>
           setFilterStatus(
           e.target.value
            )
          }


            style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        >

          <option>All</option>
          <option>Pending</option>
          <option>Shortlisted</option>
          <option>Rejected</option>

     </select>

          <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
         />

       </div>

       {filteredApplicants
        .filter(
       (applicant) =>
       applicant.name
        )
        .map((applicant) => (

     <div
            key={applicant.id}
            style={{
            background: "#fff",
            padding: "20px",
            marginBottom: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.1)"
          }}
        >

              <h2
                   style={{
                   color: "#2563eb"
            }}
          >
                   {applicant.name}
              </h2>

       <p>
       <strong>Email:</strong>
       {" "}
       {applicant.email}
       </p>

      <p>
            <strong>Phone:</strong>

                <a
                     href={`tel:${applicant.phone}`}
                     style={{
                            color: "#2563eb",
                            marginLeft: "5px",
                            textDecoration: "none",
                            fontWeight: "bold"
              }}
            >
         {applicant.phone}
         </a>
         </p>

      <p>
               <strong>Skills:</strong>
                   {" "}
               {applicant.skills}
      </p>

      <p>
                <strong>AI Score:</strong>

         <span
              style={{
                color:
                  parseInt(applicant.ai_score || 0) >= 80
                    ? "green"
                    : parseInt(applicant.ai_score || 0) >= 50
                    ? "orange"
                    : "red",

                fontWeight: "bold",

                marginLeft: "5px"
              }}
            >
              {applicant.ai_score || 0}%
            </span>
          </p>

          <p>
            <strong>Status:</strong>

            <span
              style={{
                background:
                  applicant.status === "Shortlisted"
                    ? "green"
                    : applicant.status === "Pending"
                    ? "orange"
                    : "red",

                color: "white",

                padding: "5px 12px",

                borderRadius: "20px",

                marginLeft: "10px",

                fontWeight: "bold"
              }}
            >
              {applicant.status}
            </span>
          </p>

          <div
            style={{
              marginTop: "15px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap"
            }}
          >

            <button
              onClick={() =>
                updateStatus(
                  applicant.id,
                  "Shortlisted"
                )
              }
              style={{
                padding: "10px 20px",
                border: "none",
                background: "green",
                color: "white",
                borderRadius: "8px"
              }}
            >
              Shortlist
            </button>

            <button
              onClick={() =>
                updateStatus(
                  applicant.id,
                  "Rejected"
                )
              }
              style={{
                padding: "10px 20px",
                border: "none",
                background: "red",
                color: "white",
                borderRadius: "8px"
              }}
            >
              Reject
            </button>

            <button
              onClick={() =>
                deleteApplicant(
                  applicant.id
                )
              }
              style={{
                padding: "10px 20px",
                border: "none",
                background: "black",
                color: "white",
                borderRadius: "8px"
              }}
            >
              Delete
            </button>

            <button
              onClick={() =>
                navigate(
                  "/candidate-profile",
                  {
                    state: applicant
                  }
                )
              }
              style={{
                padding: "10px 20px",
                border: "none",
                background: "#2563eb",
                color: "white",
                borderRadius: "8px"
              }}
            >
              View Profile
            </button>

            <a
              href={applicant.resume_url}
              target="_blank"
              rel="noreferrer"
            >
              <button
                style={{
                  padding: "10px 20px",
                  border: "none",
                  background: "#7c3aed",
                  color: "white",
                  borderRadius: "8px"
                }}
              >
                View Resume
              </button>
            </a>

          </div>

        </div>

      ))}

    </div>
  );
}

export default ApplicantList;