"use client";
import React, { useState } from "react";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";
import QRCode from "react-qr-code"; // Correct import for react-qr-code

const CreateArtistProfile = () => {
  const [verificationStatus, setVerificationStatus] = useState("");
  const [requestUrl, setRequestUrl] = useState("");
  const [loading, setLoading] = useState(false); // For showing loader

  const getVerificationReq = async () => {
    setLoading(true); // Show loader
    const APP_ID = process.env.NEXT_PUBLIC_RECLAIM_APP_ID as string;
    const APP_SECRET = process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET as string;
    const PROVIDER_ID = "0b68fab7-962e-45bb-8c34-475f12a854ba";

    try {
      const reclaimProofRequest = await ReclaimProofRequest.init(
        APP_ID,
        APP_SECRET,
        PROVIDER_ID
      );

      reclaimProofRequest.setParams({
        Followers: "100",
      });

      const generatedRequestUrl = await reclaimProofRequest.getRequestUrl();
      setRequestUrl(generatedRequestUrl); // Set the request URL to show the QR code
      setLoading(false); // Hide loader

      await reclaimProofRequest.startSession({
        onSuccess: (proofs) => {
          console.log("Proofs:", proofs);
          if (
            parseInt(proofs.extractedParameterValues.InstagramFollowerCount) >
            100
          ) {
            setVerificationStatus("Verified");
            window.location.href = "/artist/profile"; // Redirect to artist profile upon success
          } else {
            setVerificationStatus("Verification failed. Please try again.");
          }
        },
        onError: (error) => {
          console.log("Error:", error);
          setVerificationStatus("Verification failed. Please try again.");
        },
      });
    } catch (error) {
      console.log("Verification request error:", error);
      setLoading(false); // Hide loader in case of error
      setVerificationStatus("Verification failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-lg text-center w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Create Artist Profile</h1>
        <p className="text-gray-600 mb-6">
          In order to create an artist profile, you must prove you have 10,000+
          followers on Instagram using Reclaim Protocol.
        </p>

        {loading ? (
          <div className="mb-4">Loading...</div> // Show loader while fetching the request URL
        ) : (
          <button
            onClick={getVerificationReq}
            className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 mb-4"
          >
            Prove with Instagram
          </button>
        )}

        {requestUrl && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">
              Scan the QR code with Instagram:
            </h2>
            <div className="flex m-4 justify-center">
              <QRCode value={requestUrl} size={256} />
            </div>
          </div>
        )}

        {verificationStatus && (
          <p
            className={`mt-4 ${
              verificationStatus.includes("Verified")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {verificationStatus}
          </p>
        )}
      </div>
    </div>
  );
};

export default CreateArtistProfile;
