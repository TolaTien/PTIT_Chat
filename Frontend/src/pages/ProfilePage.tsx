import { ChangeEvent, useState } from "react";
import { Camera, Mail, User, Phone, Save } from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [email, setEmail] = useState(authUser?.email || "");
  const [phone, setPhone] = useState(authUser?.phone || "");

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImg(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    const formData = new FormData();
    if (imageFile) formData.append("media", imageFile);
    if (fullName !== authUser?.fullName) formData.append("fullName", fullName);
    if (email !== authUser?.email) formData.append("email", email);
    if (phone !== authUser?.phone) formData.append("phone", phone);

    await updateProfile(formData);
    setImageFile(null); // Reset after saving
  };

  const hasChanges = imageFile !== null || fullName !== authUser?.fullName || email !== authUser?.email || phone !== authUser?.phone;

  if (!authUser) {
    return null;
  }

  return (
    <div className="h-screen pt-20 overflow-auto">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center flex justify-between items-center">
            <div className="text-left">
                <h1 className="text-2xl font-semibold ">Profile</h1>
                <p className="mt-2 text-sm text-zinc-400">Your profile information</p>
            </div>
            {hasChanges && (
                 <button onClick={handleSaveProfile} disabled={isUpdatingProfile} className="btn btn-primary btn-sm">
                     {isUpdatingProfile ? "Saving..." : <><Save className="size-4"/> Save</>}
                 </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.avt || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 "
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              Click the camera icon to select a new photo
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <input 
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="input input-bordered w-full bg-base-200"
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input input-bordered w-full bg-base-200"
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </div>
              <input 
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="input input-bordered w-full bg-base-200"
              />
            </div>
          </div>

          <div className="mt-6 bg-base-100 rounded-xl p-6">
            <h2 className="text-lg font-medium  mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;