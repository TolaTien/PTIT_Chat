import { FormEvent, useRef, useState, ChangeEvent } from "react";
import { Image, Send, X, FileText, Paperclip } from "lucide-react";
import toast from "react-hot-toast";

import { useChatStore } from "../store/useChatStore";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | "file" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { sendMessage } = useChatStore();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
    }

    setSelectedFile(file);
    
    if (file.type.startsWith("image/")) {
        setFileType("image");
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(typeof reader.result === "string" ? reader.result : null);
        };
        reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
        setFileType("video");
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(typeof reader.result === "string" ? reader.result : null);
        };
        reader.readAsDataURL(file);
    } else {
        setFileType("file");
        setFilePreview(file.name);
    }
  };

  const removeFile = () => {
    setFilePreview(null);
    setSelectedFile(null);
    setFileType(null);

    if (imageInputRef.current) imageInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!text.trim() && !selectedFile) return;

    try {
      await sendMessage({
        text: text.trim(),
        file: selectedFile,
      });

      setText("");
      removeFile();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {filePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {fileType === "image" ? (
                <img
                    src={filePreview!}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                />
            ) : fileType === "video" ? (
                <video
                    src={filePreview!}
                    className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                />
            ) : (
                <div className="w-40 h-20 flex items-center gap-2 bg-base-300 p-2 rounded-lg border border-zinc-700">
                    <FileText className="size-8 text-primary" />
                    <span className="text-xs truncate">{filePreview}</span>
                </div>
            )}
            
            <button
              onClick={removeFile}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* Universal Hidden Input */}
          <input
            type="file"
            accept="*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <div className="flex gap-1">
            <button
                type="button"
                className={`btn btn-circle btn-sm sm:btn-md ${
                filePreview ? "text-emerald-500" : "text-zinc-400"
                }`}
                onClick={() => fileInputRef.current?.click()}
                title="Đính kèm file (Ảnh, Video, Tài liệu)"
            >
                <Paperclip size={20} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !selectedFile}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
