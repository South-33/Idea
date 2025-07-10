import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { Id } from '../convex/_generated/dataModel'; // Import Id type
import { api } from '../convex/_generated/api';
import { toast } from 'sonner'; // For potential feedback
import { MicrophoneIcon, TrashIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useAction, useMutation } from 'convex/react';

// Zoom Constants (copied from FocusedIdeaView)
const MIN_SCALE = 0.5;
const MAX_SCALE = 1.5;
const ZOOM_LEVELS = [0.5,0.75, 1.0, 1.25, 1.5];
const SCROLL_SENSITIVITY = 0.15;

// Define the expected type for the CreateIdeaView component props
type CreateIdeaViewProps = {
  onClose: () => void;
};

export function CreateIdeaView({ onClose }: CreateIdeaViewProps) {
  const [ideaContent, setIdeaContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
    const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double-clicks
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  // The onAddIdea prop will be replaced with a more comprehensive mutation
  const createIdea = useMutation(api.ideas.createIdea); // Assuming a new mutation

  // State for audio recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // Zoom State (copied from FocusedIdeaView)
  const [scale, setScale] = useState(1);
  const [zoomPercentage, setZoomPercentage] = useState(100);
  const zoomControlRef = useRef<HTMLDivElement>(null); // Ref for zoom control

  // Animation states and ref
  const [isBackdropVisible, setIsBackdropVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null); // Ref for the card element

  // Effect to prevent background scroll and trigger animation
  useEffect(() => {
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed'; // Prevent scroll jump
    document.body.style.width = '100%';

    // Trigger the animation after the component has mounted
    const animationFrameId = requestAnimationFrame(() => {
      setIsBackdropVisible(true);
    });

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = '';
      document.body.style.width = '';
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Empty dependency array ensures this runs only once on mount.


  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddClick = async () => {

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let imageId: Id<"_storage"> | undefined = undefined;
      let audioId: Id<"_storage"> | undefined = undefined;

      // 1. Upload the image if one was selected
      if (selectedImage) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        const { storageId } = await result.json();
        imageId = storageId;
      }

      // 2. Upload the audio if one was recorded
      if (recordedAudio) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "audio/webm" },
          body: recordedAudio,
        });
        const { storageId } = await result.json();
        audioId = storageId;
      }

      // 3. Create the idea with all the parts
      await createIdea({
        content: ideaContent,
        imageId,
        audioId,
      });

      onClose(); // Close the modal on success
    } catch (error) {
      console.error("Failed to add idea:", error);
      toast.error("Failed to add idea. Please try again.");
      setIsSubmitting(false); // Allow retry on error
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else if (recordedAudio) {
      // If audio is already recorded, this button acts as a delete button
      setRecordedAudio(null);
    } else {
      // Start a new recording
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          audioChunksRef.current = [];

          recorder.ondataavailable = event => {
            audioChunksRef.current.push(event.data);
          };

          recorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setRecordedAudio(audioBlob);
            stream.getTracks().forEach(track => track.stop());
          };

          recorder.start();
          setIsRecording(true);
        })
        .catch(error => {
          console.error('Error starting recording:', error);
          toast.error("Microphone access denied or not available.");
        });
    }
  };

  // Effect to handle wheel zoom on the zoom control element (copied from FocusedIdeaView)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!zoomControlRef.current?.contains(e.target as Node)) return; // Only zoom if wheel is over the control

      e.preventDefault(); // Prevent default scroll behavior
      e.stopPropagation(); // Prevent backdrop click/scroll
      const delta = e.deltaY < 0 ? SCROLL_SENSITIVITY : -SCROLL_SENSITIVITY; // Determine zoom direction and step
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
      setScale(newScale);
      setZoomPercentage(Math.round(newScale * 100));
    };

    const currentRef = zoomControlRef.current; // Capture ref value
    if (currentRef) {
      // Attach listener to the window to capture wheel events even if cursor moves slightly off
      window.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      // Remove listener from the window
       window.removeEventListener('wheel', handleWheel);
    };
  }, [scale]); // Re-run effect if scale changes

  return (
    // Backdrop - Style copied from FocusedIdeaView
    <div
      className={`fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-500 ease-in-out ${isBackdropVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      {/* Main Card Container - Applying scale transform */}
      <div
        ref={cardRef}
        className={`relative bg-white rounded-xl w-full max-w-2xl border-2 border-border-grey overflow-hidden flex flex-col shadow-lg transform transition-all duration-500 ease-in-out ${isBackdropVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
        style={{
          maxHeight: '85vh',
          transform: `scale(${scale})`,
        }}
      >
        {/* Inner Content Area */}
        <div className="p-6 flex-grow overflow-y-auto" style={{ transform: 'translateZ(0)', textRendering: 'optimizeLegibility' }}> {/* Padding moved here, allow content to scroll, Added transform and textRendering */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-dark-grey-text">Create a New Idea</h2>
              {/* Microphone Button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleMicClick(); }}
                className={`p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all ${isRecording ? 'text-red-500 animate-pulse' : recordedAudio ? 'text-blue-500' : 'text-dark-grey-text'}`}
                title={isRecording ? "Stop Recording" : recordedAudio ? "Discard Recording" : "Start Recording"}
                disabled={isSubmitting}
              >
                {recordedAudio ? <TrashIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
              </button>
            </div>

            <textarea
              value={ideaContent}
              onChange={(e) => setIdeaContent(e.target.value)}
              placeholder="Enter your brilliant idea here, or use the mic to record."
              className="w-full p-3 border border-border-grey rounded-md text-dark-grey-text focus:outline-none focus:ring-2 focus:ring-border-grey focus:border-transparent min-h-[200px] resize-y"
              rows={8}
              autoFocus
              disabled={isRecording}
            />
            <div className="mt-4">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording}
                className="w-full p-3 border-2 border-dashed border-border-grey rounded-md text-dark-grey-text hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Click to upload an image
              </button>
              {previewUrl && (
                <div className="mt-4">
                  <img src={previewUrl} alt="Preview" className="w-full rounded-md" />
                </div>
              )}

              {/* Audio Preview */}
              {recordedAudio && (
                <div className="mt-4 p-3 border-2 border-dashed border-border-grey rounded-md flex items-center gap-4">
                    <SpeakerWaveIcon className="w-6 h-6 text-dark-grey-text flex-shrink-0" />
                    <audio controls src={URL.createObjectURL(recordedAudio)} className="w-full">
                        Your browser does not support the audio element.
                    </audio>
                </div>
              )}
            </div>
        </div>


      </div>

      {/* Floating Toolbar - Style copied from FocusedIdeaView */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-50">
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
          {/* Cancel Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title="Cancel"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
             </svg>
           </button>



           {/* Functional Zoom Control (copied & adapted from FocusedIdeaView) */}
           <div
            ref={zoomControlRef} // Attach ref
            className="flex items-center text-dark-grey-text cursor-pointer select-none"
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = ZOOM_LEVELS.indexOf(scale);
              const nextIndex = (currentIndex + 1) % ZOOM_LEVELS.length;
              const newScale = ZOOM_LEVELS[nextIndex];
              setScale(newScale);
              setZoomPercentage(Math.round(newScale * 100));
            }}
             // onWheel handling is now done via the useEffect hook attached to the window
            title="Adjust Zoom (Click to snap, Scroll to fine-tune)"
          >
            <span className="font-semibold">{zoomPercentage}%</span> {/* Display dynamic zoom percentage */}
          </div>

          {/* Add Idea Button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleAddClick(); }}
            disabled={isSubmitting || !ideaContent.trim() || isRecording}
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title="Add Idea"
          >
            {isSubmitting ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dark-grey-text"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /> {/* Plus Icon */}
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}