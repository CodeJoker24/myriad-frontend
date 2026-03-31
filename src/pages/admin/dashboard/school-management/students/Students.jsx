import { useState } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaBook,
  FaGraduationCap,
  FaBan,
  FaCheckCircle,
  FaSearch,
  FaFilter,
  FaDownload,
  FaUserGraduate
} from 'react-icons/fa';

export const Students = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignClassModal, setShowAssignClassModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const students = [];
  const classes = [];

  const handleAddStudent = () => setShowAddModal(true);
  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };
  const handleDeleteStudent = (student) => console.log('Delete student:', student);
  const handleAssignClass = (student) => {
    setSelectedStudent(student);
    setShowAssignClassModal(true);
  };
  const handlePromoteStudent = (student) => {
    setSelectedStudent(student);
    setShowPromoteModal(true);
  };
  const handleSuspendStudent = (student) => console.log('Suspend student:', student);
  const handleActivateStudent = (student) => console.log('Activate student:', student);
  const handleViewReport = () => console.log('Export students');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        <p className="text-gray-500 mt-1">Manage all students, assign classes, and track progress</p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-3">
          <button
            onClick={handleAddStudent}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
          >
            <FaPlus size={16} />
            Add Student
          </button>
          <button
            onClick={handleViewReport}
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all"
          >
            <FaDownload size={16} />
            Export
          </button>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition w-64"
            />
          </div>
          <button className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl flex items-center gap-2">
            <FaFilter size={14} />
            Filter
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">S/N</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Student Name</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Admission No.</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Class</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Phone</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-500">
                    <FaUserGraduate className="text-4xl mx-auto mb-3 text-gray-300" />
                    <p>No students found</p>
                    <button
                      onClick={handleAddStudent}
                      className="mt-3 text-primary hover:text-primary-dark font-medium"
                    >
                      + Add your first student
                    </button>
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm text-gray-600">{index + 1}</td>
                    <td className="py-3 px-6 text-sm font-medium text-gray-800">{student.name}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">{student.admissionNo}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">{student.class}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">{student.email}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">{student.phone}</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditStudent(student)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                          <FaEdit size={16} />
                        </button>
                        <button onClick={() => handleAssignClass(student)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Assign Class">
                          <FaBook size={16} />
                        </button>
                        <button onClick={() => handlePromoteStudent(student)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Promote">
                          <FaGraduationCap size={16} />
                        </button>
                        {student.status === 'active' ? (
                          <button onClick={() => handleSuspendStudent(student)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Suspend">
                            <FaBan size={16} />
                          </button>
                        ) : (
                          <button onClick={() => handleActivateStudent(student)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Activate">
                            <FaCheckCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => handleDeleteStudent(student)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                          <FaTrash size={16} />
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
  );
};