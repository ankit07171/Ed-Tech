import { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiBriefcase,
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";

export default function PlacementManagement() {
  const [placements, setPlacements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState(null);
  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    studentName: "",
    department: "",
    companyName: "",
    packageLPA: "",
    year: new Date().getFullYear(),
    placementDate: "",
  });

  useEffect(() => {
    fetchData();
    fetchDepartments();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [placementsRes, statsRes] = await Promise.all([
        axios.get("/api/placements"),
        axios.get("/api/placements/stats"),
      ]);
      setPlacements(placementsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load placement data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("/api/auth/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.studentName || !formData.department || !formData.companyName || !formData.packageLPA) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      if (editingPlacement) {
        // Update
        await axios.put(`/api/placements/${editingPlacement._id}`, formData);
        toast.success("Placement record updated successfully");
      } else {
        // Create
        await axios.post("/api/placements", formData);
        toast.success("Placement record added successfully");
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving placement:", error);
      toast.error(error.response?.data?.error || "Failed to save placement record");
    }
  };

  const handleEdit = (placement) => {
    setEditingPlacement(placement);
    setFormData({
      studentName: placement.studentName,
      department: placement.department,
      companyName: placement.companyName,
      packageLPA: placement.packageLPA,
      year: placement.year,
      placementDate: placement.placementDate ? placement.placementDate.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this placement record?")) {
      return;
    }

    try {
      await axios.delete(`/api/placements/${id}`);
      toast.success("Placement record deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting placement:", error);
      toast.error("Failed to delete placement record");
    }
  };

  const resetForm = () => {
    setFormData({
      studentName: "",
      department: "",
      companyName: "",
      packageLPA: "",
      year: new Date().getFullYear(),
      placementDate: "",
    });
    setEditingPlacement(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Placement Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Add, edit, and manage placement records
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
          >
            <FiPlus size={20} />
            Add Placement
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <FiUsers size={32} className="opacity-80" />
                <span className="text-sm font-medium opacity-90">Total</span>
              </div>
              <h3 className="text-3xl font-bold">{stats.totalPlacements}</h3>
              <p className="text-sm opacity-90 mt-1">Students Placed</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <FiDollarSign size={32} className="opacity-80" />
                <span className="text-sm font-medium opacity-90">Average</span>
              </div>
              <h3 className="text-3xl font-bold">₹{stats.averagePackage}L</h3>
              <p className="text-sm opacity-90 mt-1">Package (LPA)</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <FiTrendingUp size={32} className="opacity-80" />
                <span className="text-sm font-medium opacity-90">Highest</span>
              </div>
              <h3 className="text-3xl font-bold">₹{stats.highestPackage}L</h3>
              <p className="text-sm opacity-90 mt-1">Package (LPA)</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <FiBriefcase size={32} className="opacity-80" />
                <span className="text-sm font-medium opacity-90">Companies</span>
              </div>
              <h3 className="text-3xl font-bold">{stats.totalCompanies}</h3>
              <p className="text-sm opacity-90 mt-1">Recruiters</p>
            </div>
          </div>
        )}

        {/* Placements Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              All Placement Records ({placements.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Package (LPA)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {placements.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No placement records found. Click "Add Placement" to create one.
                    </td>
                  </tr>
                ) : (
                  placements.map((placement) => (
                    <tr
                      key={placement._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                        {placement.studentName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {placement.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                        {placement.companyName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                        ₹{placement.packageLPA}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {placement.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(placement)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(placement._id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editingPlacement ? "Edit Placement" : "Add Placement"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept.code}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Package (LPA) *
                </label>
                <input
                  type="number"
                  name="packageLPA"
                  value={formData.packageLPA}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="2000"
                  max="2100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Placement Date (Optional)
                </label>
                <input
                  type="date"
                  name="placementDate"
                  value={formData.placementDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:shadow-lg transition"
                >
                  {editingPlacement ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
