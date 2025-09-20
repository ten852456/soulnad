import { useState, useEffect } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// Reusable hook for fetching SBT data
export const useSBTData = (tokenId: bigint | undefined) => {
  const [sbtData, setSBTData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch SBT basic info
  const { data: basicInfo, isLoading: isLoadingBasic } = useScaffoldReadContract({
    contractName: "SBTToken",
    functionName: "getSBTBasicInfo",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });

  // Fetch additional SBT info if needed
  const { data: additionalInfo, isLoading: isLoadingAdditional } = useScaffoldReadContract({
    contractName: "SBTToken",
    functionName: "getSBTInfo",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });

  useEffect(() => {
    const loadSBTData = async () => {
      if (!tokenId) {
        setIsLoading(false);
        return;
      }

      if (basicInfo) {
        try {
          // Map the contract response to our data structure
          // basicInfo: [name, description, issuer, mintedAt, revoked]
          const processedData = {
            tokenId,
            name: basicInfo[0] || `SBT #${tokenId}`,
            description: basicInfo[1] || "Soulbound Token",
            issuer: basicInfo[2] || "0x0000000000000000000000000000000000000000",
            mintedAt: BigInt(basicInfo[3] || Math.floor(Date.now() / 1000)),
            revoked: basicInfo[4] || false,
            // Add additional info if available
            templateId: additionalInfo ? BigInt(additionalInfo.templateId || 1) : BigInt(1),
            sessionId: additionalInfo ? additionalInfo.sessionId || "0x" : "0x",
          };

          setSBTData(processedData);
          setError(null);
        } catch (err) {
          console.error("Error processing SBT data:", err);
          setError("Failed to process SBT data");
        }
      }

      setIsLoading(isLoadingBasic || isLoadingAdditional);
    };

    loadSBTData();
  }, [tokenId, basicInfo, additionalInfo, isLoadingBasic, isLoadingAdditional]);

  return { sbtData, isLoading, error };
};

// Reusable hook for fetching session data
export const useSessionData = (sessionId: string | undefined) => {
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session info
  const { data: sessionInfo, isLoading: isLoadingSession } = useScaffoldReadContract({
    contractName: "SBTSession",
    functionName: "getSession",
    args: sessionId ? [sessionId] : undefined,
    query: {
      enabled: !!sessionId,
      refetchInterval: 30000,
    },
  });

  // Fetch template info for the session
  const { data: templateInfo, isLoading: isLoadingTemplate } = useScaffoldReadContract({
    contractName: "SBTTemplate",
    functionName: "getTemplate",
    args: sessionInfo ? [sessionInfo.templateId] : undefined,
    query: {
      enabled: !!sessionInfo?.templateId,
    },
  });

  // Check if session is claimable
  const { data: isSessionClaimable } = useScaffoldReadContract({
    contractName: "SBTSession",
    functionName: "isSessionClaimable",
    args: sessionId ? [sessionId] : undefined,
    query: {
      enabled: !!sessionId,
      refetchInterval: 30000,
    },
  });

  useEffect(() => {
    const loadSessionData = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      if (sessionInfo && templateInfo) {
        try {
          const processedData = {
            sessionId: sessionInfo.sessionId,
            templateId: sessionInfo.templateId,
            name: templateInfo.name || "SBT Token",
            description: templateInfo.description || "Soulbound Token",
            issuer: sessionInfo.issuer,
            maxMints: Number(sessionInfo.maxMints),
            currentMints: Number(sessionInfo.currentMints),
            endTimestamp: Number(sessionInfo.endTimestamp) * 1000,
            active: sessionInfo.active && isSessionClaimable,
            title: sessionInfo.title || templateInfo.name || "Token Claim Session",
            remainingMints: Number(sessionInfo.maxMints) - Number(sessionInfo.currentMints),
          };

          setSessionData(processedData);
          setError(null);
        } catch (err) {
          console.error("Error processing session data:", err);
          setError("Failed to process session data");
        }
      }

      setIsLoading(isLoadingSession || isLoadingTemplate);
    };

    loadSessionData();
  }, [sessionId, sessionInfo, templateInfo, isSessionClaimable, isLoadingSession, isLoadingTemplate]);

  return { sessionData, isLoading, error };
};

// Reusable hook for fetching template data
export const useTemplateData = (templateId: bigint | undefined) => {
  const [templateData, setTemplateData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: templateInfo, isLoading: isLoadingTemplate } = useScaffoldReadContract({
    contractName: "SBTTemplate",
    functionName: "getTemplate",
    args: templateId ? [templateId] : undefined,
    query: {
      enabled: !!templateId,
    },
  });

  useEffect(() => {
    const loadTemplateData = async () => {
      if (!templateId) {
        setIsLoading(false);
        return;
      }

      if (templateInfo) {
        try {
          const processedData = {
            templateId: templateInfo.templateId,
            name: templateInfo.name || `Template #${templateId}`,
            description: templateInfo.description || "Template description",
            issuer: templateInfo.issuer,
            createdAt: Number(templateInfo.createdAt) * 1000,
            active: templateInfo.active,
          };

          setTemplateData(processedData);
          setError(null);
        } catch (err) {
          console.error("Error processing template data:", err);
          setError("Failed to process template data");
        }
      }

      setIsLoading(isLoadingTemplate);
    };

    loadTemplateData();
  }, [templateId, templateInfo, isLoadingTemplate]);

  return { templateData, isLoading, error };
};

// Utility function to format time remaining
export const formatTimeRemaining = (timestamp: number): string => {
  const now = Date.now();
  const diff = timestamp - now;

  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
};