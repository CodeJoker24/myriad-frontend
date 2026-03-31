import { FaUser, FaCamera } from 'react-icons/fa';

export const TeacherProfile = () => {
  const teacher = JSON.parse(localStorage.getItem('teacher'));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">View and manage your profile information</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <FaUser className="text-3xl text-primary" />
              </div>
              <button className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-md">
                <FaCamera size={12} />
              </button>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{teacher?.name || 'Teacher Name'}</h3>
              <p className="text-gray-500">{teacher?.email || 'teacher@myriad.com'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                defaultValue={teacher?.name}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                defaultValue={teacher?.email}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                defaultValue={teacher?.phone || 'Not set'}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                defaultValue={teacher?.department || 'Not assigned'}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50"
                disabled
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};