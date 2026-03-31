import { useState } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaBook,
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaSearch,
  FaDownload,
  FaChalkboardTeacher
} from 'react-icons/fa';

export const Teachers = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const teachers = [];

  const handleAddTeacher = () => setShowAddModal(true);
  const handleEditTeacher = (teacher) => console.log('Edit teacher:', teacher);
  const handleDeleteTeacher = (teacher) => console.log('Delete teacher:', teacher);
  const handleAssignSubjects = (teacher) => console.log('Assign subjects:', teacher);
  const handleAssignClasses = (teacher) => console.log('Assign classes:', teacher);
  const handleToggleStatus = (teacher) => console.log('Toggle status:', teacher);
  const handleViewReport = () => console.log('Export teachers');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
        <p className="text-gray-500 mt-1">Manage teachers, assign subjects and classes</p>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-3">
          <button
            onClick={handleAddTeacher}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all"
          >
            <FaPlus size={16} />
            Add Teacher
          </button>
          <button
            onClick={handleViewReport}
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-medium flex items-center gap-2"
          >
            <FaDownload size={16} />
            Export
          </button>
        </div>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">S/N</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Teacher Name</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Phone</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Subjects</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Classes</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-500">
                    <FaChalkboardTeacher className="text-4xl mx-auto mb-3 text-gray-300" />
                    <p>No teachers found</p>
                    <button onClick={handleAddTeacher} className="mt-3 text-primary hover:text-primary-dark font-medium">
                      + Add your first teacher
                    </button>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher, index) => (
                  <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm text-gray-600">{index + 1}</td>
                    <td className="py-3 px-6 text-sm font-medium text-gray-800">{teacher.name}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">{teacher.email}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">{teacher.phone}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">-</td>
                    <td className="py-3 px-6 text-sm text-gray-600">-</td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">active</span>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><FaEdit size={16} /></button>
                        <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"><FaBook size={16} /></button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><FaUsers size={16} /></button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FaTrash size={16} /></button>
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