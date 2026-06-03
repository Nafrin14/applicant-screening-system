import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { supabase }
from "../supabase";

import Sidebar from "../components/Sidebar";

import {
  FaSearch,
} from "react-icons/fa";

function Results() {

  const navigate =
    useNavigate();

  const [
    candidates,
    setCandidates,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState("All");

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates =
    async () => {

    const { data, error } =
      await supabase
        .from("candidates")
        .select("*");

    if (error) {

      console.log(error);

    } else {

      setCandidates(data || []);

    }
  };

  const deleteCandidate =
    async (id) => {

    await supabase
      .from("candidates")
      .delete()
      .eq("id", id);

    fetchCandidates();
  };

  const filteredCandidates =
  candidates.filter(
    (candidate) => {

      const matchesSearch =
        candidate.name
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesFilter =
        filter === "All"
          ? true
          : candidate.status ===
            filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    }
  );

const rankedCandidates =
  [...filteredCandidates]
    .sort(
      (a, b) =>
        (b.score || 0) -
        (a.score || 0)
    )
    .map(
      (candidate, index) => ({
        ...candidate,
        rank: index + 1,
      })
    );

  return (

    <div className="min-h-screen bg-slate-100 flex">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}

      <div className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">

        <div className="bg-white rounded-3xl shadow-md p-6">

          {/* Header */}

          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">

            <div>

              <h1 className="text-3xl font-extrabold text-slate-800">
                Candidate List
              </h1>

              <p className="text-gray-500 mt-1">
                Manage all applicants
              </p>

            </div>

            {/* Search */}

            <div className="flex items-center bg-slate-100 px-4 py-3 rounded-2xl w-72">

              <FaSearch className="text-gray-400 mr-3" />

              <input
                type="text"
                placeholder="Search candidate..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="outline-none bg-transparent w-full"
              />

            </div>

          </div>

          {/* Filter Buttons */}

          <div className="flex gap-3 mb-6 flex-wrap">

            <button
              onClick={() =>
                setFilter("All")
              }
              className={`px-5 py-2 rounded-2xl font-medium transition ${
                filter === "All"
                  ? "bg-slate-900 text-white"
                  : "bg-gray-200"
              }`}
            >
              All
            </button>

            <button
              onClick={() =>
                setFilter(
                  "Shortlisted"
                )
              }
              className={`px-5 py-2 rounded-2xl font-medium transition ${
                filter ===
                "Shortlisted"
                  ? "bg-green-500 text-white"
                  : "bg-green-100 text-green-600"
              }`}
            >
              Shortlisted
            </button>

            <button
              onClick={() =>
                setFilter(
                  "Pending"
                )
              }
              className={`px-5 py-2 rounded-2xl font-medium transition ${
                filter ===
                "Pending"
                  ? "bg-yellow-500 text-white"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              Pending
            </button>

            <button
              onClick={() =>
                setFilter(
                  "Rejected"
                )
              }
              className={`px-5 py-2 rounded-2xl font-medium transition ${
                filter ===
                "Rejected"
                  ? "bg-red-500 text-white"
                  : "bg-red-100 text-red-600"
              }`}
            >
              Rejected
            </button>

          </div>

          {/* Table */}

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="border-b text-gray-500 text-sm">

                  <th className="text-left py-4">
                    Candidate
                  </th>

                  <th className="text-left py-4">
                    Role
                  </th>

                  <th className="text-left py-4">
                    AI Score
                  </th>

                  <th className="text-left py-4">
                    Status
                  </th>

                  <th className="text-left py-4">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {rankedCandidates.map(
  (candidate) => (
                  <tr
                    key={candidate.id}
                    className="border-b hover:bg-slate-50 transition"
                  >

                    <td className="py-5">

  <div className="flex items-center gap-3">

    <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
      {candidate.name?.charAt(0)}
    </div>

    <div>

      <p className="text-xs font-semibold text-purple-600">
        Rank #{candidate.rank}
      </p>

      <p className="font-semibold text-slate-800">
        {candidate.name}
      </p>

    </div>

  </div>

</td>
                    <td className="text-gray-600">
                      {candidate.role}
                    </td>

                    <td className="text-blue-600 font-bold">
                      {candidate.score}
                    </td>

                    <td>

                      <span
                        className={`px-4 py-1 rounded-full text-xs font-semibold ${
                          candidate.status ===
                          "Shortlisted"
                            ? "bg-green-100 text-green-600"
                            : candidate.status ===
                              "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {
                          candidate.status
                        }
                      </span>

                    </td>

                    <td>

                      <div className="flex gap-2 flex-wrap">

                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm transition">
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            deleteCandidate(
                              candidate.id
                            )
                          }
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm transition"
                        >
                          Delete
                        </button>

                        <a
                          href={
                            candidate.resume_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm transition"
                        >
                          Resume
                        </a>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>

  );
}

export default Results;