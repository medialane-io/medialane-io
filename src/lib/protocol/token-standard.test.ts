import { expect, test } from "bun:test";
import { orderNftStandard } from "./token-standard";

test("orderNftStandard reads the NFT side of a listing", () => {
  expect(orderNftStandard({ offer: { itemType: "ERC721" }, consideration: { itemType: "ERC20" } } as never)).toBe("ERC721");
});

test("orderNftStandard reads the NFT side of an offer", () => {
  expect(orderNftStandard({ offer: { itemType: "ERC20" }, consideration: { itemType: "ERC1155" } } as never)).toBe("ERC1155");
});
