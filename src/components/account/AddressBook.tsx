import { useState } from "react";
import {
  type Address,
  useAddresses,
  useRemoveAddress,
  useSaveAddress,
  useSetDefaultAddress,
} from "../../platform/address";

function AddressForm(
  { initial, onClose }: { initial?: Address; onClose: () => void },
) {
  const save = useSaveAddress();
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        const get = (k: string) => `${d.get(k) ?? ""}`.trim();
        save.mutate(
          {
            id: initial?.id,
            label: get("label"),
            recipient: get("recipient"),
            streetAddress: get("streetAddress"),
            addressLocality: get("addressLocality"),
            addressRegion: get("addressRegion"),
            postalCode: get("postalCode"),
            addressCountry: get("addressCountry"),
            isDefault: d.get("isDefault") === "on",
          },
          { onSuccess: onClose },
        );
      }}
    >
      <input name="label" defaultValue={initial?.label} placeholder="Label (Home, Work)" className="input input-bordered input-sm" />
      <input name="recipient" defaultValue={initial?.recipient} placeholder="Recipient" className="input input-bordered input-sm" />
      <input name="streetAddress" defaultValue={initial?.streetAddress} placeholder="Street address" required className="input input-bordered input-sm sm:col-span-2" />
      <input name="addressLocality" defaultValue={initial?.addressLocality} placeholder="City" className="input input-bordered input-sm" />
      <input name="addressRegion" defaultValue={initial?.addressRegion} placeholder="State/Region" className="input input-bordered input-sm" />
      <input name="postalCode" defaultValue={initial?.postalCode} placeholder="Postal code" required className="input input-bordered input-sm" />
      <input name="addressCountry" defaultValue={initial?.addressCountry} placeholder="Country" className="input input-bordered input-sm" />
      <label className="label cursor-pointer gap-2 sm:col-span-2 justify-start">
        <input type="checkbox" name="isDefault" defaultChecked={initial?.isDefault} className="checkbox checkbox-sm" />
        <span className="label-text">Set as default</span>
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="btn btn-primary btn-sm no-animation" disabled={save.isPending}>
          {save.isPending ? <span className="loading loading-spinner loading-xs" /> : "Save"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm no-animation" onClick={onClose}>
          Cancel
        </button>
      </div>
      {save.isError && (
        <span className="text-sm text-error sm:col-span-2">
          Couldn't save the address. Please try again.
        </span>
      )}
    </form>
  );
}

export default function AddressBook() {
  const { addresses, isLoading } = useAddresses();
  const remove = useRemoveAddress();
  const setDefault = useSetDefaultAddress();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="card bg-base-100 shadow p-6 max-w-xl mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Addresses</h2>
        {!adding && (
          <button
            type="button"
            className="btn btn-sm btn-outline no-animation"
            onClick={() => {
              setAdding(true);
              setEditingId(null);
            }}
          >
            Add address
          </button>
        )}
      </div>

      {adding && (
        <div className="border border-base-200 rounded p-3 mb-3">
          <AddressForm onClose={() => setAdding(false)} />
        </div>
      )}

      {isLoading
        ? <span className="loading loading-spinner" />
        : addresses.length === 0 && !adding
        ? <p className="text-sm text-base-content/60">No addresses saved yet.</p>
        : (
          <ul className="flex flex-col gap-3">
            {addresses.map((a) => (
              <li key={a.id} className="border border-base-200 rounded p-3">
                {editingId === a.id
                  ? <AddressForm initial={a} onClose={() => setEditingId(null)} />
                  : (
                    <div className="flex justify-between gap-3">
                      <div className="text-sm">
                        <div className="font-medium">
                          {a.label || a.recipient || "Address"}
                          {a.isDefault && (
                            <span className="badge badge-sm badge-primary ml-2">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-base-content/70">
                          {[
                            a.streetAddress,
                            a.addressLocality,
                            a.addressRegion,
                            a.postalCode,
                            a.addressCountry,
                          ].filter(Boolean).join(", ")}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0 items-end">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs no-animation"
                          onClick={() => {
                            setEditingId(a.id);
                            setAdding(false);
                          }}
                        >
                          Edit
                        </button>
                        {!a.isDefault && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs no-animation"
                            disabled={setDefault.isPending}
                            onClick={() => setDefault.mutate(a.id)}
                          >
                            Set default
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs no-animation text-error"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(a.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
