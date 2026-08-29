"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createInitialState, personas } from "./initialData";
import type {
  AdvisorReview,
  AdvisorService,
  AppState,
  JobContract,
  ManagerProfile,
  ManagerReview,
  OwnerReview,
  Persona,
  Session,
  SoftwareCategory,
  WaitlistEntry,
} from "./types";
import { createOpenManager } from "./managers";
import { computeVerified, uid } from "./utils";

const STORAGE_KEY = "motel-connect-v2";

type StoreContextValue = AppState & {
  hydrated: boolean;
  personas: Persona[];
  currentOwner: AppState["owners"][number] | undefined;
  currentManager: ManagerProfile | undefined;
  enterAs: (personaId: string) => void;
  signOut: () => void;
  requestInvite: (
    email: string,
    interest: "owner" | "manager",
    referredBy?: string,
  ) => Promise<string>;
  saveManager: (manager: ManagerProfile) => void;
  createProposal: (input: {
    managerId: string;
    startDate: string;
    endDate: string;
    dailyRate: number;
    contractDetails: string;
    specialConditions: string;
  }) => string | null;
  respondToProposal: (contractId: string, accept: boolean) => void;
  signNDA: (contractId: string) => void;
  sendMessage: (contractId: string, text: string) => void;
  updateContractTerms: (
    contractId: string,
    patch: Partial<Pick<JobContract, "startDate" | "endDate" | "dailyRate" | "contractDetails" | "specialConditions">>,
  ) => void;
  lockAgreement: (contractId: string) => void;
  completeContract: (contractId: string) => void;
  submitOwnerReview: (contractId: string, review: OwnerReview) => void;
  submitManagerReview: (contractId: string, review: ManagerReview) => void;
  addAdvisorReview: (input: {
    advisorId: string;
    serviceProvided: AdvisorService;
    rating: number;
    feedback: string;
  }) => void;
  setAdvisoryStack: (advisorIds: string[]) => void;
  dismissAdvisoryPrompt: () => void;
  setReferenceStatus: (
    managerId: string,
    referenceId: string,
    status: "Pending" | "Verified" | "Failed",
  ) => void;
  adminVerifyManager: (managerId: string, verified: boolean) => void;
  enqueueSoftware: (name: string, category: SoftwareCategory) => void;
  resolveSoftware: (id: string, action: "Approved" | "Merged") => void;
  setDispute: (
    contractId: string,
    patch: { disputed?: boolean; disputeNote?: string; disputeStatus?: JobContract["disputeStatus"] },
  ) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function actorName(state: AppState) {
  if (!state.session) return "System";
  if (state.session.role === "admin") return "Alex Rivera";
  if (state.session.ownerId) {
    return state.owners.find((owner) => owner.id === state.session?.ownerId)?.name ?? "Owner";
  }
  if (state.session.managerId) {
    const manager = state.managers.find((item) => item.id === state.session?.managerId);
    return manager?.profileType === "Couple" && manager.partnerName
      ? `${manager.name.split(" ")[0]} & ${manager.partnerName}`
      : manager?.name ?? "Manager";
  }
  return "Guest";
}

function actorId(state: AppState) {
  if (!state.session) return "system";
  if (state.session.role === "admin") return "admin";
  return state.session.ownerId ?? state.session.managerId ?? "guest";
}

function refreshManager(manager: ManagerProfile): ManagerProfile {
  return { ...manager, isVerified: computeVerified(manager) };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(createInitialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        const seed = createInitialState();
        // LocalStorage hydration after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState({
          ...seed,
          ...parsed,
          managers: (parsed.managers ?? seed.managers).map(refreshManager),
          advisors: (parsed.advisors ?? seed.advisors).map((advisor) => {
            const fromSeed = seed.advisors.find((item) => item.id === advisor.id);
            return {
              ...fromSeed,
              ...advisor,
              lat: advisor.lat ?? fromSeed?.lat ?? -25.3,
              lng: advisor.lng ?? fromSeed?.lng ?? 133.8,
              bio: advisor.bio || fromSeed?.bio || "",
            };
          }),
          taxonomy: parsed.taxonomy ?? seed.taxonomy,
        });
      }
    } catch {
      setState(createInitialState());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const patch = useCallback((updater: (current: AppState) => AppState) => {
    setState((current) => updater(current));
  }, []);

  const enterAs = useCallback((personaId: string) => {
    const persona = personas.find((item) => item.id === personaId);
    if (!persona) return;
    const session: Session = {
      personaId: persona.id,
      role: persona.role,
      ownerId: persona.ownerId,
      managerId: persona.managerId,
    };
    patch((current) => ({ ...current, session }));
  }, [patch]);

  const signOut = useCallback(() => {
    patch((current) => ({ ...current, session: null }));
  }, [patch]);

  const requestInvite = useCallback(
    async (email: string, interest: "owner" | "manager", referredBy?: string) => {
      const localEntry = {
        id: uid("wait"),
        email,
        interest,
        createdAt: new Date().toISOString(),
        inviteCode: `MC${uid("").replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase()}`,
        referredBy,
      };

      const enrolManager = (current: AppState): AppState => {
        if (interest !== "manager") return current;
        if (current.managers.some((manager) => manager.email.toLowerCase() === email.toLowerCase())) {
          return current;
        }
        return {
          ...current,
          managers: [createOpenManager(email), ...current.managers],
        };
      };

      try {
        const response = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, interest, referredBy }),
        });
        const payload = (await response.json()) as {
          inviteCode?: string;
          waitlist?: WaitlistEntry;
        };
        const remote = payload.waitlist;
        if (response.ok && remote) {
          patch((current) => {
            const withWaitlist = {
              ...current,
              waitlist: current.waitlist.some((entry) => entry.email === remote.email)
                ? current.waitlist.map((entry) =>
                    entry.email === remote.email ? remote : entry,
                  )
                : [remote, ...current.waitlist],
            };
            return enrolManager(withWaitlist);
          });
          return payload.inviteCode ?? remote.inviteCode;
        }
      } catch {
        // Fall through to LocalStorage when Supabase is not configured.
      }

      patch((current) => {
        const withWaitlist = {
          ...current,
          waitlist: current.waitlist.some((entry) => entry.email === email)
            ? current.waitlist
            : [localEntry, ...current.waitlist],
        };
        return enrolManager(withWaitlist);
      });
      return localEntry.inviteCode;
    },
    [patch],
  );

  const saveManager = useCallback((manager: ManagerProfile) => {
    patch((current) => {
      const next = refreshManager(manager);
      const exists = current.managers.some((item) => item.id === next.id);
      return {
        ...current,
        managers: exists
          ? current.managers.map((item) => (item.id === next.id ? next : item))
          : [...current.managers, next],
      };
    });
  }, [patch]);

  const createProposal = useCallback<StoreContextValue["createProposal"]>((input) => {
    let createdId: string | null = null;
    patch((current) => {
      if (!current.session) return current;
      if (current.session.role !== "owner" && current.session.role !== "admin") return current;
      const owner =
        current.owners.find((item) => item.id === current.session?.ownerId) ?? current.owners[0];
      const manager = current.managers.find((item) => item.id === input.managerId);
      if (!owner || !manager || !manager.isVerified) return current;
      const id = uid("job");
      createdId = id;
      const contract: JobContract = {
        id,
        ownerId: owner.id,
        ownerName: owner.name,
        ownerMotel: owner.motelName,
        managerId: manager.id,
        managerName:
          manager.profileType === "Couple" && manager.partnerName
            ? `${manager.name.split(" ")[0]} & ${manager.partnerName}`
            : manager.name,
        startDate: input.startDate,
        endDate: input.endDate,
        dailyRate: input.dailyRate,
        contractDetails: input.contractDetails,
        specialConditions: input.specialConditions,
        status: "Proposal",
        ownerSignedNDA: false,
        managerSignedNDA: false,
        ownerAgreed: false,
        managerAgreed: false,
        messages: [],
        disputed: false,
      };
      return { ...current, contracts: [contract, ...current.contracts] };
    });
    return createdId;
  }, [patch]);

  const respondToProposal = useCallback((contractId: string, accept: boolean) => {
    patch((current) => ({
      ...current,
      contracts: current.contracts.map((contract) => {
        if (contract.id !== contractId || contract.status !== "Proposal") return contract;
        return {
          ...contract,
          status: accept ? "NDAPending" : "Declined",
        };
      }),
    }));
  }, [patch]);

  const signNDA = useCallback((contractId: string) => {
    patch((current) => ({
      ...current,
      contracts: current.contracts.map((contract) => {
        if (contract.id !== contractId) return contract;
        const isOwner =
          current.session?.role === "owner" ||
          (current.session?.role === "admin" && !current.session.managerId);
        const isManager =
          current.session?.role === "verified_manager" ||
          current.session?.role === "admin";
        const next = {
          ...contract,
          ownerSignedNDA: contract.ownerSignedNDA || isOwner,
          managerSignedNDA: contract.managerSignedNDA || isManager,
        };
        if (next.ownerSignedNDA && next.managerSignedNDA && next.status === "NDAPending") {
          next.status = "ChatActive";
        }
        return next;
      }),
    }));
  }, [patch]);

  const sendMessage = useCallback((contractId: string, text: string) => {
    patch((current) => ({
      ...current,
      contracts: current.contracts.map((contract) => {
        if (contract.id !== contractId || contract.status === "Proposal") return contract;
        if (!contract.ownerSignedNDA || !contract.managerSignedNDA) return contract;
        return {
          ...contract,
          messages: [
            ...contract.messages,
            {
              id: uid("msg"),
              senderId: actorId(current),
              sender: actorName(current),
              text,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }),
    }));
  }, [patch]);

  const updateContractTerms = useCallback<StoreContextValue["updateContractTerms"]>(
    (contractId, nextPatch) => {
      patch((current) => ({
        ...current,
        contracts: current.contracts.map((contract) =>
          contract.id === contractId &&
          (contract.status === "ChatActive" || contract.status === "NDAPending")
            ? { ...contract, ...nextPatch, ownerAgreed: false, managerAgreed: false }
            : contract,
        ),
      }));
    },
    [patch],
  );

  const lockAgreement = useCallback((contractId: string) => {
    patch((current) => ({
      ...current,
      contracts: current.contracts.map((contract) => {
        if (contract.id !== contractId || contract.status !== "ChatActive") return contract;
        const isOwner = Boolean(current.session?.ownerId) || current.session?.role === "admin";
        const isManager =
          current.session?.role === "verified_manager" || current.session?.role === "admin";
        const next = {
          ...contract,
          ownerAgreed: contract.ownerAgreed || isOwner,
          managerAgreed: contract.managerAgreed || isManager,
        };
        if (next.ownerAgreed && next.managerAgreed) next.status = "Agreed";
        return next;
      }),
    }));
  }, [patch]);

  const completeContract = useCallback((contractId: string) => {
    patch((current) => ({
      ...current,
      contracts: current.contracts.map((contract) =>
        contract.id === contractId && contract.status === "Agreed"
          ? { ...contract, status: "Completed" }
          : contract,
      ),
      managers: current.managers.map((manager) => {
        const contract = current.contracts.find((item) => item.id === contractId);
        if (!contract || contract.managerId !== manager.id || contract.status !== "Agreed") {
          return manager;
        }
        return { ...manager, completedShifts: manager.completedShifts + 1 };
      }),
    }));
  }, [patch]);

  const submitOwnerReview = useCallback((contractId: string, review: OwnerReview) => {
    patch((current) => ({
      ...current,
      contracts: current.contracts.map((contract) =>
        contract.id === contractId ? { ...contract, reviewByOwner: review } : contract,
      ),
    }));
  }, [patch]);

  const submitManagerReview = useCallback((contractId: string, review: ManagerReview) => {
    patch((current) => ({
      ...current,
      contracts: current.contracts.map((contract) =>
        contract.id === contractId ? { ...contract, reviewByManager: review } : contract,
      ),
    }));
  }, [patch]);

  const addAdvisorReview = useCallback<StoreContextValue["addAdvisorReview"]>((input) => {
    patch((current) => {
      const owner =
        current.owners.find((item) => item.id === current.session?.ownerId) ?? current.owners[0];
      if (!owner) return current;
      const review: AdvisorReview = {
        id: uid("arev"),
        advisorId: input.advisorId,
        ownerId: owner.id,
        ownerName: owner.name,
        ownerMotel: owner.motelName,
        region: owner.state,
        serviceProvided: input.serviceProvided,
        rating: input.rating,
        feedback: input.feedback,
        date: new Date().toISOString().slice(0, 10),
        isVerifiedOwner: true,
      };
      return { ...current, advisorReviews: [review, ...current.advisorReviews] };
    });
  }, [patch]);

  const setAdvisoryStack = useCallback((advisorIds: string[]) => {
    patch((current) => ({
      ...current,
      owners: current.owners.map((owner) =>
        owner.id === current.session?.ownerId
          ? { ...owner, advisoryStack: advisorIds, advisoryPromptDismissed: true }
          : owner,
      ),
    }));
  }, [patch]);

  const dismissAdvisoryPrompt = useCallback(() => {
    patch((current) => ({
      ...current,
      owners: current.owners.map((owner) =>
        owner.id === current.session?.ownerId
          ? { ...owner, advisoryPromptDismissed: true }
          : owner,
      ),
    }));
  }, [patch]);

  const setReferenceStatus = useCallback<StoreContextValue["setReferenceStatus"]>(
    (managerId, referenceId, status) => {
      patch((current) => ({
        ...current,
        managers: current.managers.map((manager) => {
          if (manager.id !== managerId) return manager;
          return refreshManager({
            ...manager,
            references: manager.references.map((reference) =>
              reference.id === referenceId ? { ...reference, status } : reference,
            ),
          });
        }),
      }));
    },
    [patch],
  );

  const adminVerifyManager = useCallback((managerId: string, verified: boolean) => {
    patch((current) => ({
      ...current,
      managers: current.managers.map((manager) =>
        manager.id === managerId
          ? refreshManager({ ...manager, verifiedByAdmin: verified })
          : manager,
      ),
    }));
  }, [patch]);

  const enqueueSoftware = useCallback((name: string, category: SoftwareCategory) => {
    patch((current) => ({
      ...current,
      taxonomy: {
        ...current.taxonomy,
        customQueue: [
          {
            id: uid("sw"),
            name,
            category,
            submittedBy: actorName(current),
            status: "Pending",
          },
          ...current.taxonomy.customQueue,
        ],
      },
    }));
  }, [patch]);

  const resolveSoftware = useCallback((id: string, action: "Approved" | "Merged") => {
    patch((current) => {
      const item = current.taxonomy.customQueue.find((entry) => entry.id === id);
      if (!item) return current;
      const taxonomy = { ...current.taxonomy };
      const queue = taxonomy.customQueue.map((entry) =>
        entry.id === id ? { ...entry, status: action } : entry,
      );
      if (action === "Merged") {
        const key = item.category === "PMS" ? "pms" : item.category === "POS" ? "pos" : "hr";
        if (!taxonomy[key].includes(item.name)) {
          taxonomy[key] = [...taxonomy[key], item.name];
        }
      }
      taxonomy.customQueue = queue;
      return { ...current, taxonomy };
    });
  }, [patch]);

  const setDispute = useCallback<StoreContextValue["setDispute"]>((contractId, nextPatch) => {
    patch((current) => ({
      ...current,
      contracts: current.contracts.map((contract) =>
        contract.id === contractId ? { ...contract, ...nextPatch } : contract,
      ),
    }));
  }, [patch]);

  const currentOwner = state.owners.find((owner) => owner.id === state.session?.ownerId);
  const currentManager = state.managers.find(
    (manager) => manager.id === state.session?.managerId,
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      ...state,
      hydrated,
      personas,
      currentOwner,
      currentManager,
      enterAs,
      signOut,
      requestInvite,
      saveManager,
      createProposal,
      respondToProposal,
      signNDA,
      sendMessage,
      updateContractTerms,
      lockAgreement,
      completeContract,
      submitOwnerReview,
      submitManagerReview,
      addAdvisorReview,
      setAdvisoryStack,
      dismissAdvisoryPrompt,
      setReferenceStatus,
      adminVerifyManager,
      enqueueSoftware,
      resolveSoftware,
      setDispute,
    }),
    [
      state,
      hydrated,
      currentOwner,
      currentManager,
      enterAs,
      signOut,
      requestInvite,
      saveManager,
      createProposal,
      respondToProposal,
      signNDA,
      sendMessage,
      updateContractTerms,
      lockAgreement,
      completeContract,
      submitOwnerReview,
      submitManagerReview,
      addAdvisorReview,
      setAdvisoryStack,
      dismissAdvisoryPrompt,
      setReferenceStatus,
      adminVerifyManager,
      enqueueSoftware,
      resolveSoftware,
      setDispute,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}
