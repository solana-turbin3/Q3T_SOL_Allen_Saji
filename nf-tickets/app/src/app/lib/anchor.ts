import * as idl from "@/idl/nf_tickets.json";
import type { NfTickets } from "@/idl/types/nf_tickets";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  Keypair,
} from "@solana/web3.js";
import {
  useAnchorWallet,
  useConnection,
  AnchorWallet,
} from "@solana/wallet-adapter-react";
import { Program, Idl, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import ownerWallet from "../wallets/wallet.json";
import { WalletContextState } from "@solana/wallet-adapter-react";

// Create the Solana connection and provider setup
const connection = new Connection("https://api.devnet.solana.com");
// const wallet = useAnchorWallet();
const programId = "5qCfMhUmbJmau9SGHP1qAEMfKwEzyyyQ846SMXX2y6w";
// const provider = new AnchorProvider(
//   connection,
//   wallet as unknown as AnchorWallet,
//   {}
// );
// setProvider(provider);

// const program = new Program(idl as Idl) as Program<NfTickets>;

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(ownerWallet));

export async function createManager(
  wallet: WalletContextState
): Promise<PublicKey> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected or unable to sign transactions");
  }

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  const program = new Program<NfTickets>(idl, programId, provider);
  console.log("program", program.programId.toString());

  // Derive the PDA for the manager
  const [managerPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("manager"), wallet.publicKey.toBuffer()],
    program.programId
  );

  // Create a transaction to setup the manager
  const tx = await program.methods
    .setupManager()
    .accountsPartial({
      signer: keypair.publicKey,
      payer: wallet.publicKey,
      manager: managerPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  // Send and sign the transaction using the wallet
  const signedTx = await wallet.signTransaction(tx);
  const signature = await connection.sendRawTransaction(signedTx.serialize());

  // Confirm the transaction
  await connection.confirmTransaction(signature, "confirmed");

  console.log("Manager created successfully:", managerPda.toString());
  return managerPda;
}
